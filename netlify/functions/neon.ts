import { neon, neonConfig } from '@neondatabase/serverless';

// Enable connection caching
neonConfig.fetchConnectionCache = true;

function getNeonClient() {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL or NEON_DATABASE_URL is not configured in Netlify environment variables.');
  }
  return neon(url);
}

export const handler = async (event: any) => {
  const path = event.path || '';
  const httpMethod = event.httpMethod || 'GET';
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

    // 1. Health / Status check
    if (path.endsWith('/status')) {
      if (!url) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            connected: false,
            database: 'neondb',
            host: 'neon.tech',
            uriConfigured: false,
            error: 'DATABASE_URL is not set in Netlify environment variables.',
          }),
        };
      }

      const sql = getNeonClient();
      const startTime = Date.now();
      const result = await sql`SELECT version(), current_database() as db, NOW() as current_time`;
      const latencyMs = Date.now() - startTime;

      let tablesCount = 0;
      try {
        const tables = await sql`SELECT count(*)::int as count FROM information_schema.tables WHERE table_schema = 'public'`;
        tablesCount = tables[0]?.count || 0;
      } catch {
        // ignore
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          connected: true,
          database: result[0]?.db || 'neondb',
          host: 'neon.tech',
          version: String(result[0]?.version || 'PostgreSQL (Neon)').split(' on ')[0],
          latencyMs,
          tablesCount,
          uriConfigured: true,
          provider: 'Netlify Functions + Neon PostgreSQL',
        }),
      };
    }

    // 2. Initialize Tables
    if (path.endsWith('/init-tables') && httpMethod === 'POST') {
      const sql = getNeonClient();
      await sql`
        CREATE TABLE IF NOT EXISTS farm_kv_store (
          collection_name VARCHAR(64) NOT NULL,
          doc_id VARCHAR(128) NOT NULL,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (collection_name, doc_id)
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_farm_kv_data ON farm_kv_store USING GIN (data);`;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Neon PostgreSQL tables initialized successfully on Netlify.',
        }),
      };
    }

    // 3. Sync (Push)
    if (path.endsWith('/sync') && httpMethod === 'POST') {
      const sql = getNeonClient();
      const body = JSON.parse(event.body || '{}');

      // Ensure KV store table exists
      await sql`
        CREATE TABLE IF NOT EXISTS farm_kv_store (
          collection_name VARCHAR(64) NOT NULL,
          doc_id VARCHAR(128) NOT NULL,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (collection_name, doc_id)
        );
      `;

      const counts: Record<string, number> = {};

      const collections = [
        { name: 'flocks', items: body.flocks },
        { name: 'egg_collections', items: body.eggRecords },
        { name: 'feed_records', items: body.feedRecords },
        { name: 'depletions', items: body.depletions },
        { name: 'weight_records', items: body.weightRecords },
        { name: 'biosecurity_logs', items: body.biosecurityLogs },
      ];

      for (const col of collections) {
        if (col.items && Array.isArray(col.items)) {
          for (const item of col.items) {
            const id = String(item.id || item._id || `${col.name}_${Date.now()}`);
            await sql`
              INSERT INTO farm_kv_store (collection_name, doc_id, data, updated_at)
              VALUES (${col.name}, ${id}, ${JSON.stringify(item)}, NOW())
              ON CONFLICT (collection_name, doc_id) DO UPDATE SET
                data = EXCLUDED.data,
                updated_at = NOW();
            `;
          }
          counts[col.name] = col.items.length;
        }
      }

      if (body.farmProfile) {
        await sql`
          INSERT INTO farm_kv_store (collection_name, doc_id, data, updated_at)
          VALUES ('farm_profile', 'default', ${JSON.stringify(body.farmProfile)}, NOW())
          ON CONFLICT (collection_name, doc_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
        `;
        counts.farmProfile = 1;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          syncedAt: new Date().toISOString(),
          counts,
        }),
      };
    }

    // 4. Pull
    if (path.endsWith('/pull') && httpMethod === 'GET') {
      const sql = getNeonClient();
      const rows = await sql`
        SELECT collection_name, doc_id, data 
        FROM farm_kv_store
        ORDER BY updated_at DESC
      `;

      const result: Record<string, any[]> = {
        flocks: [],
        egg_collections: [],
        feed_records: [],
        depletions: [],
        weight_records: [],
        biosecurity_logs: [],
      };
      let farmProfile: any = null;

      for (const row of rows) {
        if (row.collection_name === 'farm_profile') {
          farmProfile = row.data;
        } else if (result[row.collection_name]) {
          result[row.collection_name].push(row.data);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            farmProfile,
            flocks: result.flocks,
            eggRecords: result.egg_collections,
            feedRecords: result.feed_records,
            depletions: result.depletions,
            weightRecords: result.weight_records,
            biosecurityLogs: result.biosecurity_logs,
          },
          pulledAt: new Date().toISOString(),
        }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: `Route not found for path: ${path}` }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err?.message || 'Server error in Netlify Neon function' }),
    };
  }
};
