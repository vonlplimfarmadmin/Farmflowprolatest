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
} from './server/mongodb';

dotenv.config();

// ============================================================================
// 1. Security & HTTP Middleware
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const MAX_RATE_LIMIT_KEYS = 10000;
const rateLimitMap = new Map<string, RateLimitEntry>();

// Periodic eviction of expired rate-limit entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt <= now) {
      rateLimitMap.delete(key);
    }
  }
}, 3 * 60 * 1000).unref?.();

/**
 * Bounded sliding-window rate limiter per client IP.
 */
export function createRateLimiter(maxRequests: number, windowMs: number): express.RequestHandler {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const rawIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    const key = rawIp;
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || entry.resetAt <= now) {
      if (rateLimitMap.size >= MAX_RATE_LIMIT_KEYS) {
        const oldestKey = rateLimitMap.keys().next().value;
        if (oldestKey) rateLimitMap.delete(oldestKey);
      }
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

/**
 * Hardened HTTP security headers middleware.
 */
export const securityHeadersMiddleware: express.RequestHandler = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  next();
};

/**
 * Disables caching on dynamic API routes and HTML entrypoints.
 */
export const dynamicCacheControlMiddleware: express.RequestHandler = (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/' || req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  next();
};

/**
 * Normalizes Netlify Function proxy paths (/.netlify/functions/api/* -> /api/*).
 */
export const netlifyPathNormalizerMiddleware: express.RequestHandler = (req, _res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    const stripped = req.url.replace(/^\/\.netlify\/functions\/api/, '');
    if (stripped.startsWith('/api')) {
      req.url = stripped;
    } else {
      req.url = '/api' + (stripped.startsWith('/') ? stripped : '/' + stripped);
    }
  }
  next();
};

// ============================================================================
// 2. Database Connection & Readiness Guard
// ============================================================================

export let lastConnectionError: string | null = null;
export let activeDbName =
  (process.env.MONGODB_DB_NAME && process.env.MONGODB_DB_NAME.trim()) || 'farmflowproviii';
export let cachedPromise: Promise<boolean> | null = null;

export function resetCachedConnectionPromise(): void {
  cachedPromise = null;
}

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
      const db = (
        questionIndex !== -1 ? pathWithQuery.substring(0, questionIndex) : pathWithQuery
      ).trim();
      if (db && !db.includes('/') && !db.startsWith('<')) {
        return db;
      }
    }
  } catch {
    // Fall back to active default
  }
  return (process.env.MONGODB_DB_NAME && process.env.MONGODB_DB_NAME.trim()) || 'farmflowproviii';
};

export const ensureInitialData = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return;
    }
    const db = mongoose.connection.db;

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

    const profileCol = db.collection('farmProfile');
    const existingProfile = await profileCol.findOne({});
    if (!existingProfile) {
      const defaultProfile = {
        id: 'farmProfile',
        name: 'L.P. LIM CITY FAMILY FARM INC',
        logoUrl:
          'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=200&q=80',
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
      await profileCol.updateOne(
        { _id: 'farmProfile' as any },
        { $set: defaultProfile },
        { upsert: true }
      );
      console.log('[MongoDB Seeding] Seeded initial farm profile');
    }
  } catch (err: any) {
    console.error('[MongoDB] Seeding error:', err.message);
  }
};

export const connectDB = async (): Promise<boolean> => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (cachedPromise) {
    try {
      return await cachedPromise;
    } catch {
      // Fall through to retry if previous attempt failed
    }
  }

  cachedPromise = (async () => {
    let uri = (
      process.env.MONGODB_URI ||
      process.env.MONGODB_URL ||
      process.env.MONGO_URI ||
      process.env.MONGO_URL ||
      process.env.DATABASE_URL ||
      ''
    ).trim();

    if (!uri) {
      lastConnectionError = 'MONGODB_URI environment variable is missing.';
      return false;
    }

    uri = uri.replace(/\s/g, '');
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
      ensureInitialData().catch((err) => console.error('[MongoDB] Seeding error:', err.message));
      return true;
    } catch (err: any) {
      lastConnectionError = err.message || 'Failed to connect to MongoDB Atlas';
      console.error('[MongoDB] Connection attempt failed:', lastConnectionError);
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

/**
 * Express middleware that ensures an active database connection before handling data routes.
 */
export const databaseGuardMiddleware: express.RequestHandler = async (req, res, next) => {
  if (req.path === '/health' || req.path === '/db/reconnect') {
    return next();
  }

  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message:
        'Database connection is not established. Please verify your MONGODB_URI and IP whitelist in Atlas (allow 0.0.0.0/0).',
      dbStatus: mongoose.connection.readyState,
      errorDetails: lastConnectionError,
    });
  }
  next();
};

// ============================================================================
// 3. Modular API Router
// ============================================================================

export const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', async (_req, res) => {
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
apiRouter.all('/db/reconnect', async (_req, res) => {
  try {
    resetCachedConnectionPromise();
    const connected = await connectDB();
    const status = await checkConnection();
    res.json({
      success: connected,
      status,
      message: connected ? 'Connected to MongoDB Atlas' : lastConnectionError || 'Connection failed',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Reconnect attempt failed',
    });
  }
});

// MongoDB Status & Diagnostics
apiRouter.get('/mongodb/status', async (_req, res) => {
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
apiRouter.get('/mongodb/pull', async (_req, res) => {
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
apiRouter.post('/mongodb/sync', async (req, res) => {
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
apiRouter.post('/mongodb/purge', async (req, res) => {
  try {
    const {
      collections,
      preserveUsers = true,
      preserveStandards = true,
      preserveFarmProfile = true,
    } = req.body || {};
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
apiRouter.get('/mongodb/farm-profile', async (_req, res) => {
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

apiRouter.post('/mongodb/farm-profile', async (req, res) => {
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
apiRouter.get('/mongodb/doc/:collection/:id', async (req, res) => {
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

apiRouter.post('/mongodb/doc/:collection/:id', async (req, res) => {
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

apiRouter.put('/mongodb/doc/:collection/:id', async (req, res) => {
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

apiRouter.delete('/mongodb/doc/:collection/:id', async (req, res) => {
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
apiRouter.post('/users/sync', async (req, res) => {
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

apiRouter.delete('/users/:id', async (req, res) => {
  try {
    const cleanId = sanitizeDocId(req.params.id);
    const deleted = await deleteDocument('users', cleanId);
    res.json({ success: true, deleted });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Error deleting user' });
  }
});

// ============================================================================
// 4. Express Application Instance
// ============================================================================

export const app = express();

// Prevent server technology fingerprinting
app.disable('x-powered-by');

// Global HTTP Security, Payload Limits, Cache-Control & Path Normalization
app.use(securityHeadersMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(dynamicCacheControlMiddleware);
app.use(netlifyPathNormalizerMiddleware);

// API Rate Limiting, Database Readiness Guard & Modular Route Controller
app.use('/api', createRateLimiter(5000, 60 * 1000));
app.use('/api', databaseGuardMiddleware);
app.use('/api', apiRouter);
