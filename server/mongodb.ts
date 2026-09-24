import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_DB_NAME = process.env.MONGODB_DB_NAME || 'farmflowproviii';

let client: MongoClient | null = null;
let db: Db | null = null;
let connectionPromise: Promise<Db> | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;

  if (connectionPromise) {
    return connectionPromise;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  connectionPromise = (async () => {
    try {
      const newClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 10000,
        maxPoolSize: 20,
        minPoolSize: 1,
        retryWrites: true,
      });

      await newClient.connect();
      client = newClient;
      db = client.db(DEFAULT_DB_NAME);
      console.log(`[MongoDB] Connected successfully to database: "${DEFAULT_DB_NAME}"`);

      // Ensure primary indexes for high-performance lookups
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

      return db;
    } catch (err: any) {
      connectionPromise = null;
      db = null;
      client = null;
      console.error('[MongoDB] Connection error:', err.message);
      throw err;
    }
  })();

  return connectionPromise;
}

export async function checkConnection(): Promise<{
  connected: boolean;
  dbName: string;
  uriConfigured: boolean;
  serverInfo?: string;
  collections?: { name: string; count: number }[];
  error?: string | null;
}> {
  const uriConfigured = !!process.env.MONGODB_URI;
  if (!uriConfigured) {
    return {
      connected: false,
      dbName: DEFAULT_DB_NAME,
      uriConfigured: false,
      error: 'MONGODB_URI is not set in environment',
    };
  }

  try {
    const database = await getDb();
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

    return {
      connected: true,
      dbName: DEFAULT_DB_NAME,
      uriConfigured: true,
      serverInfo: 'MongoDB Production Cluster Active & Ready',
      collections: collectionsWithCounts,
      error: null,
    };
  } catch (err: any) {
    return {
      connected: false,
      dbName: DEFAULT_DB_NAME,
      uriConfigured: true,
      error: err.message || 'Failed to connect to MongoDB cluster',
    };
  }
}

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

const SAFE_ID_PATTERN = /^[a-zA-Z0-9_\-\.:@]{1,128}$/;

/**
 * Validates whether a collection name is in the authorized whitelist
 */
export function isAllowedCollection(name: string): boolean {
  return typeof name === 'string' && KNOWN_COLLECTIONS.includes(name);
}

/**
 * Validates and sanitizes a document identifier to prevent path traversal or injection
 */
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

/**
 * Deep sanitization for MongoDB payloads:
 * - Strips all keys starting with '$' (NoSQL operator injection)
 * - Strips all keys containing '.' (field traversal injection)
 * - Strips prototype pollution keys (__proto__, constructor, prototype)
 */
export function sanitizeMongoObject<T>(input: T, depth = 0): T {
  if (depth > 12) return null as any;
  if (!input || typeof input !== 'object') return input;

  if (Array.isArray(input)) {
    return input.slice(0, 5000).map(item => sanitizeMongoObject(item, depth + 1)) as unknown as T;
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

  for (const name of KNOWN_COLLECTIONS) {
    try {
      const col = database.collection(name);
      if (name === 'farmProfile') {
        const doc = await col.findOne({ _id: { $in: ['farmProfile', 'profile'] as any } });
        if (doc) {
          const { _id, ...rest } = doc;
          result.farmProfile = rest;
        } else {
          const first = await col.findOne({});
          if (first) {
            const { _id, ...rest } = first;
            result.farmProfile = rest;
          }
        }
      } else if (name === 'standards') {
        const doc = await col.findOne({ _id: 'standards' as any });
        if (doc) {
          const { _id, ...rest } = doc;
          result.standards = rest;
        }
      } else if (name === 'settings') {
        const doc = await col.findOne({ _id: 'global_settings' as any });
        if (doc) {
          const { _id, ...rest } = doc;
          result.settings = rest;
        }
      } else {
        const docs = await col.find({}).limit(5000).toArray();
        result[name] = docs.map((d) => {
          const { _id, ...rest } = d;
          return { id: (d as any).id || _id.toString(), ...rest };
        });
      }
    } catch (e: any) {
      console.warn(`[MongoDB] Failed to read collection ${name}:`, e.message);
      result[name] = [];
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

  for (const name of KNOWN_COLLECTIONS) {
    const data = payload[name];
    if (!data) continue;

    const col = database.collection(name);

    if (name === 'farmProfile' && typeof data === 'object') {
      const cleanProfile = sanitizeMongoObject(data);
      await col.updateOne(
        { _id: 'farmProfile' as any },
        { $set: { ...cleanProfile, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
      counts.farmProfile = 1;
    } else if (name === 'standards' && typeof data === 'object') {
      const cleanStandards = sanitizeMongoObject(data);
      await col.updateOne(
        { _id: 'standards' as any },
        { $set: { ...cleanStandards, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
      counts.standards = 1;
    } else if (name === 'settings' && typeof data === 'object') {
      const cleanSettings = sanitizeMongoObject(data);
      await col.updateOne(
        { _id: 'global_settings' as any },
        { $set: { ...cleanSettings, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
      counts.settings = 1;
    } else if (Array.isArray(data)) {
      if (data.length === 0) {
        counts[name] = 0;
        continue;
      }

      const bulkOps = data
        .slice(0, 5000)
        .filter(item => item && typeof item === 'object')
        .map((item: any) => {
          const cleanItem = sanitizeMongoObject(item);
          const rawId = cleanItem.id || cleanItem._id || ('doc_' + Math.random().toString(36).slice(2, 10));
          const docId = sanitizeDocId(rawId);
          const { _id, ...rest } = cleanItem;
          return {
            updateOne: {
              filter: { id: docId },
              update: { $set: { ...rest, id: docId, updatedAt: new Date().toISOString() } },
              upsert: true,
            },
          };
        });

      if (bulkOps.length > 0) {
        const res = await col.bulkWrite(bulkOps as any, { ordered: false });
        counts[name] = (res.upsertedCount || 0) + (res.modifiedCount || 0);
      }
    }
  }

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

  await col.updateOne(
    { id: cleanId },
    { $set: { ...rest, id: cleanId, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );

  return { success: true, data: { ...rest, id: cleanId } };
}

export async function getDocument(collectionName: string, docId: string): Promise<any | null> {
  if (!isAllowedCollection(collectionName)) {
    throw new Error('Access to unauthorized collection rejected');
  }
  const cleanId = sanitizeDocId(docId);
  const database = await getDb();
  const col = database.collection(collectionName);
  const doc = await col.findOne({ id: cleanId });
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
