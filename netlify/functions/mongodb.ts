import { MongoClient } from 'mongodb';

export interface HandlerEvent {
  path: string;
  httpMethod: string;
  headers: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined> | null;
  body?: string | null;
}

export interface HandlerResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

export type Handler = (event: HandlerEvent, context?: any) => Promise<HandlerResponse>;

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'farmflowproviii';

let cachedClient: MongoClient | null = null;

async function getClient(): Promise<MongoClient> {
  if (cachedClient) return cachedClient;
  if (!uri) throw new Error('MONGODB_URI is not defined');
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  await client.connect();
  cachedClient = client;
  return client;
}

const KNOWN_COLLECTIONS = [
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

const SAFE_ID_REGEX = /^[a-zA-Z0-9_\-\.:@]{1,128}$/;

function isSafeId(id: string): boolean {
  return typeof id === 'string' && SAFE_ID_REGEX.test(id.trim());
}

function sanitizeObject<T>(input: T, depth = 0): T {
  if (depth > 12) return null as any;
  if (!input || typeof input !== 'object') return input;

  if (Array.isArray(input)) {
    return input.slice(0, 5000).map(item => sanitizeObject(item, depth + 1)) as unknown as T;
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
    clean[key] = sanitizeObject(val, depth + 1);
  }
  return clean as T;
}

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const client = await getClient();
    const db = client.db(dbName);
    const path = event.path.replace(/\/\.netlify\/functions\/mongodb/, '').replace(/\/api\/mongodb\/?/, '');
    const segments = path.split('/').filter(Boolean);

    // GET /api/mongodb/status
    if (segments[0] === 'status' || segments.length === 0) {
      await db.command({ ping: 1 });
      const collections = await db.listCollections().toArray();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          connected: true,
          dbName,
          uriConfigured: true,
          serverInfo: 'Netlify Serverless MongoDB Driver Active',
          collections: collections.map((c) => ({ name: c.name, count: 0 })),
        }),
      };
    }

    // GET /api/mongodb/pull
    if (segments[0] === 'pull' && event.httpMethod === 'GET') {
      const data: Record<string, any> = {};
      for (const colName of KNOWN_COLLECTIONS) {
        try {
          const col = db.collection(colName);
          if (colName === 'farmProfile') {
            const doc = await col.findOne({});
            if (doc) {
              const { _id, ...rest } = doc;
              data.farmProfile = rest;
            }
          } else {
            const items = await col.find({}).limit(5000).toArray();
            data[colName] = items.map((i) => {
              const { _id, ...rest } = i;
              return { id: (i as any).id || _id.toString(), ...rest };
            });
          }
        } catch {
          data[colName] = [];
        }
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data }),
      };
    }

    // POST /api/mongodb/sync
    if (segments[0] === 'sync' && event.httpMethod === 'POST') {
      const rawBody = event.body || '{}';
      if (rawBody.length > 10 * 1024 * 1024) {
        return { statusCode: 413, headers, body: JSON.stringify({ error: 'Payload exceeds safe size limit' }) };
      }
      const parsed = JSON.parse(rawBody);
      const payload = sanitizeObject(parsed);
      const counts: Record<string, number> = {};

      for (const [key, val] of Object.entries(payload)) {
        if (!val || !KNOWN_COLLECTIONS.includes(key)) continue;
        const col = db.collection(key);

        if (key === 'farmProfile' && typeof val === 'object') {
          await col.updateOne({ _id: 'farmProfile' as any }, { $set: val }, { upsert: true });
          counts[key] = 1;
        } else if (Array.isArray(val) && val.length > 0) {
          const bulkOps = val
            .slice(0, 5000)
            .filter(item => item && typeof item === 'object')
            .map((item: any) => {
              const rawId = String(item.id || item._id || ('doc_' + Math.random().toString(36).slice(2, 10)));
              const id = isSafeId(rawId) ? rawId : ('doc_' + Math.random().toString(36).slice(2, 10));
              const { _id, ...rest } = item;
              return {
                updateOne: {
                  filter: { id },
                  update: { $set: { ...rest, id } },
                  upsert: true,
                },
              };
            });
          if (bulkOps.length > 0) {
            const res = await col.bulkWrite(bulkOps as any, { ordered: false });
            counts[key] = (res.upsertedCount || 0) + (res.modifiedCount || 0);
          }
        }
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, counts }),
      };
    }

    // Doc CRUD /api/mongodb/doc/:collection/:id
    if (segments[0] === 'doc' && segments.length >= 3) {
      const colName = segments[1];
      const docId = decodeURIComponent(segments[2]).trim();

      if (!KNOWN_COLLECTIONS.includes(colName)) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Forbidden collection' }) };
      }
      if (!isSafeId(docId)) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Invalid document ID format' }) };
      }

      const col = db.collection(colName);

      if (event.httpMethod === 'GET') {
        const doc = await col.findOne({ id: docId });
        if (!doc) return { statusCode: 404, headers, body: JSON.stringify({ success: false }) };
        const { _id, ...rest } = doc;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: { ...rest, id: docId } }) };
      }

      if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
        const rawBody = event.body || '{}';
        if (rawBody.length > 5 * 1024 * 1024) {
          return { statusCode: 413, headers, body: JSON.stringify({ error: 'Payload exceeds size limit' }) };
        }
        const parsed = JSON.parse(rawBody);
        const clean = sanitizeObject(parsed);
        const { _id, ...rest } = clean;
        await col.updateOne(
          { id: docId },
          { $set: { ...rest, id: docId, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: { ...rest, id: docId } }) };
      }

      if (event.httpMethod === 'DELETE') {
        const res = await col.deleteOne({ id: docId });
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, deleted: res.deletedCount > 0 }) };
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found', path }),
    };
  } catch (err: any) {
    console.error('[Netlify Function Error]', err?.message || err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Database request failed' }),
    };
  }
};
