import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  checkConnection,
  pullAllCollections,
  syncAllCollections,
  upsertDocument,
  getDocument,
  deleteDocument,
  isAllowedCollection,
  sanitizeDocId,
  purgeOldRecords,
} from './server/mongodb.ts';

dotenv.config();

// In-memory sliding rate-limit tracker
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt <= now) {
      rateLimitMap.delete(key);
    }
  }
}, 3 * 60 * 1000);

function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
    const key = `${rawIp}:${req.baseUrl || ''}${req.path}`;
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || entry.resetAt <= now) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please slow down and try again shortly.',
      });
    }

    next();
  };
}

export const app = express();

// Prevent server technology fingerprinting
app.disable('x-powered-by');

// Hardened Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  next();
});

// Strict Request Body Limit to prevent memory exhaustion / DoS
app.use(express.json({ limit: '10mb' }));

// Global Cache-Control middleware for dynamic API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/' || req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  next();
});

// Normalizer for Netlify Function proxy redirects
app.use((req, _res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    const stripped = req.url.replace(/^\/\.netlify\/functions\/api/, '');
    if (stripped.startsWith('/api')) {
      req.url = stripped;
    } else {
      req.url = '/api' + (stripped.startsWith('/') ? stripped : '/' + stripped);
    }
  }
  next();
});

// Apply generous rate limit to prevent DDoS while never throttling active farm logging
app.use('/api', createRateLimiter(5000, 60 * 1000));

// API Request Guard Middleware
app.use("/api", async (req, res, next) => {
  if (req.path === "/health" || req.path === "/db/reconnect") {
    return next();
  }

  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database connection is not established. Please verify your MONGODB_URI and IP whitelist in Atlas (allow 0.0.0.0/0).",
      dbStatus: mongoose.connection.readyState,
      errorDetails: lastConnectionError,
    });
  }
  next();
});

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  try {
    const status = await checkConnection();
    res.json({
      status: status.connected ? 'ok' : 'degraded',
      service: 'FarmFlow Pro OS',
      timestamp: new Date().toISOString(),
      mongodb: status,
    });
  } catch {
    res.status(500).json({
      status: 'error',
      error: 'Health check failed',
    });
  }
});

// Dedicated Reconnect & Diagnostics endpoint
app.all('/api/db/reconnect', async (_req, res) => {
  try {
    cachedPromise = null;
    const connected = await connectDB();
    const status = await checkConnection();
    res.json({
      success: connected,
      status,
      message: connected ? 'Connected to MongoDB Atlas' : (lastConnectionError || 'Connection failed'),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Reconnect attempt failed',
    });
  }
});

// MongoDB Status & Diagnostics
app.get('/api/mongodb/status', async (_req, res) => {
  try {
    const status = await checkConnection();
    res.json(status);
  } catch {
    res.status(500).json({
      connected: false,
      error: 'Unable to retrieve database status',
    });
  }
});

// Pull All Collections
app.get('/api/mongodb/pull', async (_req, res) => {
  try {
    const data = await pullAllCollections();
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[API /api/mongodb/pull] error:', err?.message || err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve farm dataset',
    });
  }
});

// Sync / Push All Collections
app.post('/api/mongodb/sync', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, error: 'Malformed synchronization payload' });
    }
    const result = await syncAllCollections(payload);
    res.json(result);
  } catch (err: any) {
    console.error('[API /api/mongodb/sync] error:', err?.message || err);
    res.status(500).json({
      success: false,
      error: 'Database synchronization failed',
    });
  }
});

// Purge / Delete Persistent Old Records from Database
app.post('/api/mongodb/purge', async (req, res) => {
  try {
    const { collections, preserveUsers = true, preserveStandards = true, preserveFarmProfile = true } = req.body || {};
    const result = await purgeOldRecords({
      collectionsToClear: collections,
      preserveUsers,
      preserveStandards,
      preserveFarmProfile,
    });
    res.json(result);
  } catch (err: any) {
    console.error('[API /api/mongodb/purge] error:', err?.message || err);
    res.status(500).json({ success: false, error: 'Failed to purge database records' });
  }
});

// Farm Profile Endpoints
app.get('/api/mongodb/farm-profile', async (_req, res) => {
  try {
    const data = await pullAllCollections();
    res.json({
      success: true,
      data: data.farmProfile || null,
      standards: data.standards || null,
      settings: data.settings || null,
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to retrieve farm profile' });
  }
});

app.post('/api/mongodb/farm-profile', async (req, res) => {
  try {
    const profile = req.body;
    if (!profile || typeof profile !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid profile data' });
    }
    const result = await syncAllCollections({ farmProfile: profile });
    res.json({
      success: true,
      message: 'Farm profile saved directly to MongoDB.',
      result,
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to save farm profile' });
  }
});

// Single Document CRUD with Whitelist & ID Validation
app.get('/api/mongodb/doc/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    if (!isAllowedCollection(collection)) {
      return res.status(400).json({ success: false, message: 'Invalid or prohibited collection' });
    }
    const cleanId = sanitizeDocId(id);
    const doc = await getDocument(collection, cleanId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    res.json({ success: true, data: doc });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Error fetching document' });
  }
});

app.post('/api/mongodb/doc/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    if (!isAllowedCollection(collection)) {
      return res.status(400).json({ success: false, message: 'Invalid or prohibited collection' });
    }
    const cleanId = sanitizeDocId(id);
    const result = await upsertDocument(collection, cleanId, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Error saving document' });
  }
});

app.put('/api/mongodb/doc/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    if (!isAllowedCollection(collection)) {
      return res.status(400).json({ success: false, message: 'Invalid or prohibited collection' });
    }
    const cleanId = sanitizeDocId(id);
    const result = await upsertDocument(collection, cleanId, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Error updating document' });
  }
});

app.delete('/api/mongodb/doc/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    if (!isAllowedCollection(collection)) {
      return res.status(400).json({ success: false, message: 'Invalid or prohibited collection' });
    }
    const cleanId = sanitizeDocId(id);
    const deleted = await deleteDocument(collection, cleanId);
    res.json({ success: true, deleted });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Error deleting document' });
  }
});

// Dedicated user endpoints with validation
app.post('/api/users/sync', async (req, res) => {
  try {
    const user = req.body;
    if (!user || typeof user !== 'object' || !user.id) {
      return res.status(400).json({ success: false, message: 'Invalid user payload' });
    }
    const cleanId = sanitizeDocId(user.id);
    const result = await upsertDocument('users', cleanId, user);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Error synchronizing user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const cleanId = sanitizeDocId(req.params.id);
    const deleted = await deleteDocument('users', cleanId);
    res.json({ success: true, deleted });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Error deleting user' });
  }
});

// ==========================================
// Core Database Connection (Mongoose ODM)
// ==========================================

export let lastConnectionError: string | null = null;
export let activeDbName = (process.env.MONGODB_DB_NAME && process.env.MONGODB_DB_NAME.trim()) || "farmflowproviii";
export let cachedPromise: Promise<boolean> | null = null;

export const getTargetDbName = (uri: string): string => {
  const configured = process.env.MONGODB_DB_NAME;
  if (configured && configured.trim()) {
    return configured.trim();
  }
  try {
    const clean = uri.replace(/\s/g, '');
    const withoutProtocol = clean.replace(/^mongodb(\+srv)?:\/\//, '');
    const slashIndex = withoutProtocol.indexOf('/');
    if (slashIndex !== -1) {
      const pathWithQuery = withoutProtocol.substring(slashIndex + 1);
      const questionIndex = pathWithQuery.indexOf('?');
      const db = (questionIndex !== -1 ? pathWithQuery.substring(0, questionIndex) : pathWithQuery).trim();
      if (db && !db.includes('/') && !db.startsWith('<')) {
        return db;
      }
    }
  } catch {
    // Fall back to active default
  }
  return (process.env.MONGODB_DB_NAME && process.env.MONGODB_DB_NAME.trim()) || "farmflowproviii";
};

export const ensureInitialData = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return;
    }
    const db = mongoose.connection.db;

    // Non-blocking index creation
    await Promise.allSettled([
      db.collection('users').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('users').createIndex({ username: 1 }, { sparse: true }),
      db.collection('flocks').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('eggRecords').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('eggRecords').createIndex({ date: 1, houseNumber: 1 }),
      db.collection('feedRecords').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('depletions').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('bodyWeights').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('biosecurityLogs').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('auditLogs').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('auditLogs').createIndex({ timestamp: -1 }),
      db.collection('hatchingSummaries').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('deliveries').createIndex({ id: 1 }, { unique: true, sparse: true }),
    ]);

    // Admin user seeding check
    const usersCol = db.collection('users');
    const existingAdmin = await usersCol.findOne({
      $or: [{ id: 'usr_admin' }, { username: 'admin' }, { role: 'admin' }],
    });
    if (!existingAdmin) {
      const adminUser = {
        id: 'usr_admin',
        username: 'admin',
        fullName: 'Von L.P. Lim (Owner / Admin)',
        email: 'von.lplimfarm@gmail.com',
        role: 'admin',
        status: 'active',
        designatedHouses: ['House 1', 'House 2', 'House 3', 'House 4', 'House 5', 'House 6'],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        securityQuestion: 'What is your farm location?',
        securityAnswer: 'Batangas',
        contactNumber: '+63 917 555 2473',
      };
      await usersCol.updateOne({ id: 'usr_admin' }, { $set: adminUser }, { upsert: true });
      console.log('[MongoDB Seeding] Seeded initial admin user (usr_admin / admin)');
    }

    // Farm profile seeding check
    const profileCol = db.collection('farmProfile');
    const existingProfile = await profileCol.findOne({});
    if (!existingProfile) {
      const defaultProfile = {
        id: 'farmProfile',
        name: 'L.P. LIM CITY FAMILY FARM INC',
        logoUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=200&q=80',
        address: 'San Jose Agro-Industrial Complex, Batangas / Central Luzon, Philippines',
        contactNumber: '+63 917 555 2473 / (043) 723-8890',
        email: 'von.lplimfarm@gmail.com',
        establishedYear: '2012',
        currency: 'PHP',
        farmOwners: 'L.P. Lim & Family',
        presidentCeo: 'Von L.P. Lim',
        industrySector: 'Commercial Broiler-Breeder Parent Stock (PS)',
        primaryBreeds: 'Cobb 500 & Ross 308 Parent Stock',
        facilityHousesCount: '6 Environmentally Controlled (EC)',
        totalBirdCapacity: '~60,000 Breeders',
        dailyEggCapacity: '~50,000 Eggs/day',
        createdAt: new Date().toISOString(),
      };
      await profileCol.updateOne({ _id: 'farmProfile' as any }, { $set: defaultProfile }, { upsert: true });
      console.log('[MongoDB Seeding] Seeded initial farm profile');
    }
  } catch (err: any) {
    console.error('[MongoDB] Seeding error:', err.message);
  }
};

export const connectDB = async (): Promise<boolean> => {
  // 1. Fast return if already connected (1 = connected)
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  // 2. If another request already initiated connection, wait for the same promise
  if (cachedPromise) {
    try {
      return await cachedPromise;
    } catch {
      // Fall through to retry if it failed
    }
  }

  // 3. Initiate cached connection promise
  cachedPromise = (async () => {
    // Read and resolve connection URI from environment variables
    let uri = (
      process.env.MONGODB_URI ||
      process.env.MONGODB_URL ||
      process.env.MONGO_URI ||
      process.env.MONGO_URL ||
      process.env.DATABASE_URL ||
      ""
    ).trim();

    if (!uri) {
      lastConnectionError = "MONGODB_URI environment variable is missing.";
      return false;
    }

    // Sanitize URI (clean placeholder brackets and malformed query params)
    uri = uri.replace(/\s/g, "");
    activeDbName = getTargetDbName(uri);

    try {
      await mongoose.connect(uri, {
        dbName: activeDbName,
        serverSelectionTimeoutMS: 6000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
      });

      console.log(`[MongoDB] Connected successfully to database "${activeDbName}"`);
      // Non-blocking initial seeding check (admin user, farm profile)
      ensureInitialData().catch(err => console.error("[MongoDB] Seeding error:", err.message));
      return true;
    } catch (err: any) {
      lastConnectionError = err.message || "Failed to connect to MongoDB Atlas";
      console.error("[MongoDB] Connection attempt failed:", lastConnectionError);
      return false;
    }
  })();

  try {
    const success = await cachedPromise;
    if (!success) cachedPromise = null;
    return success;
  } catch {
    cachedPromise = null;
    return false;
  }
};
