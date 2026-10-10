import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import type { Db } from 'mongodb';

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
// 2. Database Connection, Indexing, Seeding & Readiness Guard
// ============================================================================

export const KNOWN_COLLECTIONS = [
  'flocks',
  'eggRecords',
  'feedRecords',
  'feedStock',
  'depletions',
  'transfers',
  'medProducts',
  'medStockLogs',
  'medAdmins',
  'bodyWeights',
  'biosecurityLogs',
  'biosecurityRequirements',
  'biosecuritySummaries',
  'weeklyEggWeights',
  'deliveries',
  'hatchingSummaries',
  'users',
  'auditLogs',
  'farmProfile',
  'standards',
  'settings',
];

const SAFE_ID_PATTERN = /^[a-zA-Z0-9_\-\.:@\s]{1,128}$/;

function stripSurroundingQuotes(val: string): string {
  return val.trim().replace(/^['"]+|['"]+$/g, '').trim();
}

export let lastConnectionError: string | null = null;
export let activeDbName =
  (process.env.MONGODB_DB_NAME && stripSurroundingQuotes(process.env.MONGODB_DB_NAME)) ||
  'farmflowproviii';
export let cachedPromise: Promise<boolean> | null = null;

let indexesEnsured = false;
let cachedConnectionStatus: {
  timestamp: number;
  data: {
    connected: boolean;
    dbName: string;
    uriConfigured: boolean;
    serverInfo?: string;
    collections?: { name: string; count: number }[];
    error?: string | null;
  };
} | null = null;
const CONNECTION_STATUS_CACHE_TTL_MS = 5000;

export function resetCachedConnectionPromise(): void {
  cachedPromise = null;
  cachedConnectionStatus = null;
}

export const getTargetDbName = (uri: string): string => {
  const configured = process.env.MONGODB_DB_NAME;
  if (configured && stripSurroundingQuotes(configured)) {
    return stripSurroundingQuotes(configured);
  }
  try {
    const clean = stripSurroundingQuotes(uri).replace(/\s/g, '');
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
  return (
    (process.env.MONGODB_DB_NAME && stripSurroundingQuotes(process.env.MONGODB_DB_NAME)) ||
    'farmflowproviii'
  );
};

async function ensureDatabaseIndexes(database: Db): Promise<void> {
  if (indexesEnsured) return;
  indexesEnsured = true;

  const timeSeriesCollections = new Set([
    'eggRecords',
    'feedRecords',
    'depletions',
    'medAdmins',
    'bodyWeights',
    'biosecurityLogs',
    'deliveries',
    'hatchingSummaries',
  ]);

  await Promise.all(
    KNOWN_COLLECTIONS.map(async (name) => {
      try {
        const col = database.collection(name);
        await col.createIndex({ id: 1 }, { background: true });
        if (timeSeriesCollections.has(name)) {
          await col.createIndex({ date: -1, houseNumber: 1 }, { background: true });
        }
        if (name === 'users') {
          await col.createIndex({ username: 1 }, { background: true });
          await col.createIndex({ email: 1 }, { background: true });
        }
      } catch {
        // Ignore index creation warnings on read-only or capped tiers
      }
    })
  );
}

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
    const rawUri =
      process.env.MONGODB_URI ||
      process.env.MONGODB_URL ||
      process.env.MONGO_URI ||
      process.env.MONGO_URL ||
      process.env.DATABASE_URL ||
      '';
    let uri = stripSurroundingQuotes(rawUri);

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

      lastConnectionError = null;
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

export async function getDb(): Promise<Db> {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const db = mongoose.connection.db as unknown as Db;
    if (!indexesEnsured) {
      ensureDatabaseIndexes(db).catch(() => {});
    }
    return db;
  }

  const success = await connectDB();
  if (!success || mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new Error(lastConnectionError || 'Database connection is not established.');
  }

  const db = mongoose.connection.db as unknown as Db;
  if (!indexesEnsured) {
    ensureDatabaseIndexes(db).catch(() => {});
  }
  return db;
}

export async function checkConnection(): Promise<{
  connected: boolean;
  dbName: string;
  uriConfigured: boolean;
  serverInfo?: string;
  collections?: { name: string; count: number }[];
  error?: string | null;
}> {
  const uriConfigured = !!(
    process.env.MONGODB_URI ||
    process.env.MONGODB_URL ||
    process.env.MONGO_URI ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL
  );

  if (!uriConfigured) {
    return {
      connected: false,
      dbName: activeDbName,
      uriConfigured: false,
      error: 'MONGODB_URI environment variable is missing.',
    };
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return {
        connected: false,
        dbName: activeDbName,
        uriConfigured: true,
        error: lastConnectionError || 'Failed to connect to MongoDB Atlas',
      };
    }

    const now = Date.now();
    if (
      cachedConnectionStatus &&
      cachedConnectionStatus.data.dbName === activeDbName &&
      now - cachedConnectionStatus.timestamp < CONNECTION_STATUS_CACHE_TTL_MS
    ) {
      return cachedConnectionStatus.data;
    }

    const database = mongoose.connection.db as unknown as Db;
    await database.command({ ping: 1 });
    const colList = await database.listCollections().toArray();
    const collectionsWithCounts = await Promise.all(
      colList.map(async (col) => {
        try {
          const count = await database.collection(col.name).estimatedDocumentCount();
          return { name: col.name, count };
        } catch {
          return { name: col.name, count: 0 };
        }
      })
    );

    const statusPayload = {
      connected: true,
      dbName: activeDbName,
      uriConfigured: true,
      serverInfo: `Mongoose (v${mongoose.version}) Connected to Atlas [${activeDbName}]`,
      collections: collectionsWithCounts,
      error: null,
    };
    cachedConnectionStatus = { timestamp: now, data: statusPayload };
    return statusPayload;
  } catch (err: any) {
    return {
      connected: false,
      dbName: activeDbName,
      uriConfigured: true,
      error: err?.message || lastConnectionError || 'Failed to connect to MongoDB cluster',
    };
  }
}

export function isAllowedCollection(name: string): boolean {
  return typeof name === 'string' && KNOWN_COLLECTIONS.includes(name);
}

export function sanitizeDocId(id: unknown): string {
  if (typeof id !== 'string' && typeof id !== 'number') {
    throw new Error('Invalid document identifier format');
  }
  const clean = String(id).trim();
  if (!SAFE_ID_PATTERN.test(clean)) {
    throw new Error('Document identifier contains prohibited characters');
  }
  return clean;
}

export function sanitizeMongoObject<T>(input: T, depth = 0): T {
  if (depth > 12) return null as any;
  if (!input || typeof input !== 'object') return input;

  if (Array.isArray(input)) {
    return input.slice(0, 5000).map((item) => sanitizeMongoObject(item, depth + 1)) as unknown as T;
  }

  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(input as Record<string, any>)) {
    if (
      key.startsWith('$') ||
      key.includes('.') ||
      key === '__proto__' ||
      key === 'constructor' ||
      key === 'prototype'
    ) {
      continue;
    }
    clean[key] = sanitizeMongoObject(val, depth + 1);
  }
  return clean as T;
}

export async function pullAllCollections(): Promise<Record<string, any>> {
  const database = await getDb();
  const result: Record<string, any> = {};

  await Promise.all(
    KNOWN_COLLECTIONS.map(async (name) => {
      try {
        const col = database.collection(name);
        if (name === 'farmProfile') {
          const doc =
            (await col.findOne({ _id: { $in: ['farmProfile', 'profile'] as any } })) ||
            (await col.findOne({}));
          if (doc) {
            const { _id, ...rest } = doc;
            result.farmProfile = { id: 'farmProfile', ...rest };
          }
        } else if (name === 'standards') {
          const docs = await col.find({}).limit(500).toArray();
          const stdMap: Record<string, any> = {};
          for (const d of docs) {
            const { _id, id, ...rest } = d;
            const key = String(id || _id || '').trim();
            if (key) {
              stdMap[key] = { id: key, ...rest };
            }
          }
          result.standards = stdMap;
        } else if (name === 'settings') {
          const doc = await col.findOne({ _id: 'global_settings' as any });
          if (doc) {
            const { _id, ...rest } = doc;
            result.settings = rest;
          }
        } else if (name === 'biosecuritySummaries') {
          const docs = await col.find({}).limit(5000).toArray();
          const summaryObj: Record<string, any> = {};
          for (const d of docs) {
            const { _id, id, ...rest } = d;
            const docId = id || (d as any).date || _id?.toString();
            if (docId) {
              summaryObj[docId] = { id: docId, ...rest };
            }
          }
          result.biosecuritySummaries = summaryObj;
        } else {
          const docs = await col.find({}).limit(5000).toArray();
          result[name] = docs.map((d) => {
            const { _id, ...rest } = d;
            return { id: (d as any).id || _id.toString(), ...rest };
          });
        }
      } catch (e: any) {
        console.warn(`[MongoDB] Failed to read collection ${name}:`, e.message);
        result[name] = name === 'biosecuritySummaries' ? {} : [];
      }
    })
  );

  if (result.farmProfile && typeof result.farmProfile === 'object') {
    const stds = result.standards || {};
    if (Array.isArray(stds.vaccination?.items) && stds.vaccination.items.length > 0) {
      if (
        !result.farmProfile.standardVaccinationProgram ||
        stds.vaccination.items.length >= result.farmProfile.standardVaccinationProgram.length
      ) {
        result.farmProfile.standardVaccinationProgram = stds.vaccination.items;
      }
    }
    if (Array.isArray(stds.feedGuide?.items) && stds.feedGuide.items.length > 0) {
      if (
        !result.farmProfile.standardFeedGuide ||
        stds.feedGuide.items.length >= result.farmProfile.standardFeedGuide.length
      ) {
        result.farmProfile.standardFeedGuide = stds.feedGuide.items;
      }
    }
    if (Array.isArray(stds.bodyWeights?.items) && stds.bodyWeights.items.length > 0) {
      if (
        !result.farmProfile.standardBodyWeights ||
        stds.bodyWeights.items.length >= result.farmProfile.standardBodyWeights.length
      ) {
        result.farmProfile.standardBodyWeights = stds.bodyWeights.items;
      }
    }
    if (Array.isArray(stds.henday?.items) && stds.henday.items.length > 0) {
      if (
        !result.farmProfile.standardHenday ||
        stds.henday.items.length >= result.farmProfile.standardHenday.length
      ) {
        result.farmProfile.standardHenday = stds.henday.items;
      }
    }
    if (Array.isArray(stds.eggWeights?.items) && stds.eggWeights.items.length > 0) {
      if (
        !result.farmProfile.standardEggWeights ||
        stds.eggWeights.items.length >= result.farmProfile.standardEggWeights.length
      ) {
        result.farmProfile.standardEggWeights = stds.eggWeights.items;
      }
    }
  }

  return result;
}

export async function syncAllCollections(payload: Record<string, any>): Promise<{
  success: boolean;
  message: string;
  counts: Record<string, number>;
}> {
  const database = await getDb();
  const counts: Record<string, number> = {};
  const nowIso = new Date().toISOString();

  await Promise.all(
    KNOWN_COLLECTIONS.map(async (name) => {
      const data = payload[name];
      if (!data) return;

      const col = database.collection(name);

      if (name === 'farmProfile' && typeof data === 'object') {
        const cleanProfile = sanitizeMongoObject(data);
        const existing =
          (await col.findOne({ _id: { $in: ['farmProfile', 'profile'] as any } })) ||
          (await col.findOne({}));
        const preserved: Record<string, any> = {};
        if (existing) {
          if (
            !cleanProfile.standardVaccinationProgram?.length &&
            existing.standardVaccinationProgram?.length
          ) {
            preserved.standardVaccinationProgram = existing.standardVaccinationProgram;
          }
          if (!cleanProfile.standardFeedGuide?.length && existing.standardFeedGuide?.length) {
            preserved.standardFeedGuide = existing.standardFeedGuide;
          }
          if (!cleanProfile.standardBodyWeights?.length && existing.standardBodyWeights?.length) {
            preserved.standardBodyWeights = existing.standardBodyWeights;
          }
          if (!cleanProfile.standardHenday?.length && existing.standardHenday?.length) {
            preserved.standardHenday = existing.standardHenday;
          }
          if (!cleanProfile.standardEggWeights?.length && existing.standardEggWeights?.length) {
            preserved.standardEggWeights = existing.standardEggWeights;
          }
        }
        await col.updateOne(
          { _id: 'farmProfile' as any },
          { $set: { ...cleanProfile, ...preserved, id: 'farmProfile', updatedAt: nowIso } },
          { upsert: true }
        );
        counts.farmProfile = 1;
      } else if (name === 'standards' && typeof data === 'object') {
        const cleanStandards = sanitizeMongoObject(data);
        const stdOps: any[] = [];
        if (Array.isArray(cleanStandards)) {
          for (const item of cleanStandards) {
            if (item && item.id) {
              stdOps.push({
                updateOne: {
                  filter: { $or: [{ id: item.id }, { _id: item.id as any }] },
                  update: { $set: { ...item, updatedAt: nowIso } },
                  upsert: true,
                },
              });
            }
          }
        } else {
          for (const [key, val] of Object.entries(cleanStandards)) {
            if (val && typeof val === 'object') {
              stdOps.push({
                updateOne: {
                  filter: { $or: [{ id: key }, { _id: key as any }] },
                  update: { $set: { ...(val as any), id: key, updatedAt: nowIso } },
                  upsert: true,
                },
              });
            }
          }
        }
        if (stdOps.length > 0) {
          await col.bulkWrite(stdOps, { ordered: false });
        }
        counts.standards = 1;
      } else if (name === 'settings' && typeof data === 'object') {
        const cleanSettings = sanitizeMongoObject(data);
        await col.updateOne(
          { _id: 'global_settings' as any },
          { $set: { ...cleanSettings, updatedAt: nowIso } },
          { upsert: true }
        );
        counts.settings = 1;
      } else if (
        name === 'biosecuritySummaries' &&
        typeof data === 'object' &&
        !Array.isArray(data)
      ) {
        const cleanSummaries = sanitizeMongoObject(data);
        const bulkOps = Object.entries(cleanSummaries)
          .filter(([_, item]) => item && typeof item === 'object')
          .map(([dateKey, item]) => {
            const safeKey = sanitizeDocId(dateKey);
            const { _id, ...rest } = item as any;
            return {
              updateOne: {
                filter: { id: safeKey },
                update: { $set: { ...rest, id: safeKey, updatedAt: nowIso } },
                upsert: true,
              },
            };
          });
        if (bulkOps.length > 0) {
          const res = await col.bulkWrite(bulkOps as any, { ordered: false });
          counts.biosecuritySummaries = (res.upsertedCount || 0) + (res.modifiedCount || 0);
        }
      } else if (Array.isArray(data)) {
        if (data.length === 0) {
          counts[name] = 0;
          return;
        }

        const bulkOps = data
          .slice(0, 5000)
          .filter((item) => item && typeof item === 'object')
          .map((item: any) => {
            const cleanItem = sanitizeMongoObject(item);
            const rawId =
              cleanItem.id || cleanItem._id || 'doc_' + Math.random().toString(36).slice(2, 10);
            const docId = sanitizeDocId(rawId);
            const { _id, ...rest } = cleanItem;
            return {
              updateOne: {
                filter: { id: docId },
                update: { $set: { ...rest, id: docId, updatedAt: nowIso } },
                upsert: true,
              },
            };
          });

        if (bulkOps.length > 0) {
          const res = await col.bulkWrite(bulkOps as any, { ordered: false });
          counts[name] = (res.upsertedCount || 0) + (res.modifiedCount || 0);
        }
      }
    })
  );

  cachedConnectionStatus = null;
  return {
    success: true,
    message: 'MongoDB synchronized successfully with all farm records.',
    counts,
  };
}

export async function upsertDocument(
  collectionName: string,
  docId: string,
  data: any
): Promise<{ success: boolean; data?: any }> {
  if (!isAllowedCollection(collectionName)) {
    throw new Error('Access to unauthorized collection rejected');
  }
  const cleanId = sanitizeDocId(docId);
  const cleanData = sanitizeMongoObject(data || {});
  const database = await getDb();
  const col = database.collection(collectionName);
  const { _id, ...rest } = cleanData;

  if (collectionName === 'farmProfile') {
    const existing =
      (await col.findOne({ _id: { $in: ['farmProfile', 'profile'] as any } })) ||
      (await col.findOne({ id: cleanId }));
    const preservedStandards: Record<string, any> = {};
    if (existing) {
      if (
        (!rest.standardVaccinationProgram || rest.standardVaccinationProgram.length === 0) &&
        existing.standardVaccinationProgram?.length
      ) {
        preservedStandards.standardVaccinationProgram = existing.standardVaccinationProgram;
      }
      if (
        (!rest.standardFeedGuide || rest.standardFeedGuide.length === 0) &&
        existing.standardFeedGuide?.length
      ) {
        preservedStandards.standardFeedGuide = existing.standardFeedGuide;
      }
      if (
        (!rest.standardBodyWeights || rest.standardBodyWeights.length === 0) &&
        existing.standardBodyWeights?.length
      ) {
        preservedStandards.standardBodyWeights = existing.standardBodyWeights;
      }
      if (
        (!rest.standardHenday || rest.standardHenday.length === 0) &&
        existing.standardHenday?.length
      ) {
        preservedStandards.standardHenday = existing.standardHenday;
      }
      if (
        (!rest.standardEggWeights || rest.standardEggWeights.length === 0) &&
        existing.standardEggWeights?.length
      ) {
        preservedStandards.standardEggWeights = existing.standardEggWeights;
      }
    }
    await col.updateOne(
      { _id: 'farmProfile' as any },
      {
        $set: {
          ...rest,
          ...preservedStandards,
          id: 'farmProfile',
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );
    if (cleanId !== 'farmProfile') {
      await col.updateOne(
        { id: cleanId },
        {
          $set: {
            ...rest,
            ...preservedStandards,
            id: cleanId,
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
    }
  } else if (collectionName === 'standards') {
    await col.updateOne(
      { $or: [{ id: cleanId }, { _id: cleanId as any }] },
      { $set: { ...rest, id: cleanId, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
  } else {
    await col.updateOne(
      { id: cleanId },
      { $set: { ...rest, id: cleanId, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
  }

  return { success: true, data: { ...rest, id: cleanId } };
}

export async function getDocument(collectionName: string, docId: string): Promise<any | null> {
  if (!isAllowedCollection(collectionName)) {
    throw new Error('Access to unauthorized collection rejected');
  }
  const cleanId = sanitizeDocId(docId);
  const database = await getDb();
  const col = database.collection(collectionName);
  const query =
    collectionName === 'users'
      ? {
          $or: [
            { id: cleanId },
            { username: cleanId.toLowerCase() },
            { email: cleanId.toLowerCase() },
          ],
        }
      : { id: cleanId };
  const doc = await col.findOne(query);
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: doc.id || _id.toString(), ...rest };
}

export async function deleteDocument(collectionName: string, docId: string): Promise<boolean> {
  if (!isAllowedCollection(collectionName)) {
    throw new Error('Access to unauthorized collection rejected');
  }
  const cleanId = sanitizeDocId(docId);
  const database = await getDb();
  const col = database.collection(collectionName);
  const res = await col.deleteOne({ id: cleanId });
  return res.deletedCount > 0;
}

export async function purgeOldRecords(options?: {
  collectionsToClear?: string[];
  preserveUsers?: boolean;
  preserveStandards?: boolean;
  preserveFarmProfile?: boolean;
}): Promise<{ success: boolean; cleared: Record<string, number>; message: string }> {
  const database = await getDb();
  const cleared: Record<string, number> = {};

  const defaultTargets = [
    'flocks',
    'eggRecords',
    'feedRecords',
    'feedStock',
    'depletions',
    'transfers',
    'medProducts',
    'medStockLogs',
    'medAdmins',
    'bodyWeights',
    'biosecurityLogs',
    'weeklyEggWeights',
    'deliveries',
    'hatchingSummaries',
    'auditLogs',
  ];

  const targets =
    options?.collectionsToClear && options.collectionsToClear.length > 0
      ? options.collectionsToClear.filter(isAllowedCollection)
      : defaultTargets;

  for (const colName of targets) {
    if (colName === 'users' && options?.preserveUsers !== false) continue;
    if (colName === 'farmProfile' && options?.preserveFarmProfile !== false) continue;
    if (colName === 'standards' && options?.preserveStandards !== false) continue;

    try {
      const col = database.collection(colName);
      const res = await col.deleteMany({});
      cleared[colName] = res.deletedCount || 0;
    } catch (e: any) {
      console.warn(`[MongoDB] Failed to clear collection ${colName}:`, e.message);
      cleared[colName] = 0;
    }
  }

  return {
    success: true,
    cleared,
    message: 'Persistent old records successfully purged from MongoDB database.',
  };
}

/**
 * Express middleware that ensures an active database connection before handling data routes.
 */
export const databaseGuardMiddleware: express.RequestHandler = async (req, res, next) => {
  if (
    req.path === '/health' ||
    req.path === '/db/reconnect' ||
    req.path === '/mongodb/status'
  ) {
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

// Catch-all 404 handler for unknown API routes so they never fall through to SPA HTML
apiRouter.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// ============================================================================
// 4. Express Application Instance
// ============================================================================

export const app = express();

// Trust reverse proxies (Render, Cloud Run, Netlify, Cloudflare)
app.set('trust proxy', 1);

// Prevent server technology fingerprinting
app.disable('x-powered-by');

// Global HTTP Security, Payload Limits, Cache-Control & Path Normalization
app.use(securityHeadersMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(dynamicCacheControlMiddleware);
app.use(netlifyPathNormalizerMiddleware);

// Fast liveness probe for Render / Cloud Run load balancers
app.get('/healthz', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'FarmFlow Pro OS',
    timestamp: new Date().toISOString(),
  });
});

// API Rate Limiting, Database Readiness Guard & Modular Route Controller
app.use('/api', createRateLimiter(5000, 60 * 1000));
app.use('/api', databaseGuardMiddleware);
app.use('/api', apiRouter);
