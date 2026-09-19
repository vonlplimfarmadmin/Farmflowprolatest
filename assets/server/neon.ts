import { neon, neonConfig, Pool } from '@neondatabase/serverless';

// Enable connection caching in serverless environments
neonConfig.fetchConnectionCache = true;

export interface NeonStatus {
  connected: boolean;
  database: string;
  host: string;
  version?: string;
  latencyMs?: number;
  tablesCount?: number;
  uriConfigured: boolean;
  error?: string | null;
  lastSyncedAt?: string | null;
}

let lastNeonSyncTime: string | null = null;

/**
 * Gets the configured Neon PostgreSQL connection string.
 * Netlify Neon Integration automatically populates DATABASE_URL.
 */
export function getNeonConnectionString(): string | null {
  return process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || null;
}

/**
 * Creates a Neon SQL query client.
 */
export function getNeonClient(customUrl?: string) {
  const url = customUrl || getNeonConnectionString();
  if (!url) {
    throw new Error('DATABASE_URL or NEON_DATABASE_URL environment variable is not configured.');
  }
  return neon(url);
}

/**
 * Checks the status, latency, and table counts of the Neon PostgreSQL database.
 */
export async function getNeonStatus(customUrl?: string): Promise<NeonStatus> {
  const url = customUrl || getNeonConnectionString();

  if (!url) {
    return {
      connected: false,
      database: 'neondb',
      host: 'neon.tech',
      uriConfigured: false,
      error: 'DATABASE_URL is not set. Add your Neon connection string in environment variables or Netlify integration.',
      lastSyncedAt: lastNeonSyncTime,
    };
  }

  // Parse host and database name safely
  let host = 'neon.tech';
  let database = 'neondb';
  try {
    const parsed = new URL(url.replace('postgresql://', 'http://').replace('postgres://', 'http://'));
    host = parsed.hostname;
    database = parsed.pathname.replace(/^\//, '') || 'neondb';
  } catch {
    // fallback
  }

  try {
    const sql = getNeonClient(url);
    const startTime = Date.now();

    // Query server version and current timestamp to verify connectivity and latency
    const result = await sql`SELECT version(), current_database() as db, NOW() as current_time`;
    const latencyMs = Date.now() - startTime;

    // Check count of user tables in the public schema
    let tablesCount = 0;
    try {
      const tablesResult = await sql`
        SELECT count(*)::int as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      if (tablesResult && tablesResult[0]) {
        tablesCount = tablesResult[0].count;
      }
    } catch {
      // ignore
    }

    const versionStr = result[0]?.version ? String(result[0].version).split(' on ')[0] : 'PostgreSQL (Neon)';

    return {
      connected: true,
      database: result[0]?.db || database,
      host,
      version: versionStr,
      latencyMs,
      tablesCount,
      uriConfigured: true,
      lastSyncedAt: lastNeonSyncTime,
      error: null,
    };
  } catch (err: any) {
    return {
      connected: false,
      database,
      host,
      uriConfigured: true,
      error: err?.message || 'Could not connect to Neon PostgreSQL',
      lastSyncedAt: lastNeonSyncTime,
    };
  }
}

/**
 * Automatically initializes all required tables and indexes in Neon PostgreSQL.
 * Uses JSONB columns for flexible data structure preservation, plus dedicated relational columns.
 */
export async function initNeonTables(customUrl?: string): Promise<{ success: boolean; message: string; tables: string[] }> {
  const sql = getNeonClient(customUrl);

  const tables = [
    'farm_profile',
    'farm_flocks',
    'egg_collections',
    'feed_records',
    'depletions',
    'weight_records',
    'biosecurity_logs',
    'farm_kv_store',
  ];

  // 1. Key-Value and Document Store Table (Enables instant syncing of any farm collection)
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

  // Create GIN index for fast JSON querying
  await sql`
    CREATE INDEX IF NOT EXISTS idx_farm_kv_data ON farm_kv_store USING GIN (data);
  `;

  // 2. Farm Profile Table
  await sql`
    CREATE TABLE IF NOT EXISTS farm_profile (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      address TEXT,
      contact_number VARCHAR(100),
      email VARCHAR(255),
      established_year VARCHAR(20),
      industry_sector VARCHAR(100),
      facility_houses_count INT,
      total_bird_capacity INT,
      daily_egg_capacity INT,
      logo_url TEXT,
      raw_profile JSONB,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 3. Farm Flocks Table
  await sql`
    CREATE TABLE IF NOT EXISTS farm_flocks (
      id VARCHAR(128) PRIMARY KEY,
      flock_name VARCHAR(255) NOT NULL,
      house_number VARCHAR(64),
      breed VARCHAR(100),
      current_males INT DEFAULT 0,
      current_females INT DEFAULT 0,
      hatch_date DATE,
      housing_date DATE,
      status VARCHAR(50) DEFAULT 'Active',
      raw_flock JSONB,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 4. Egg Collections Table
  await sql`
    CREATE TABLE IF NOT EXISTS egg_collections (
      id VARCHAR(128) PRIMARY KEY,
      flock_id VARCHAR(128),
      date DATE NOT NULL,
      time VARCHAR(20),
      total_eggs INT DEFAULT 0,
      hatching_eggs INT DEFAULT 0,
      rejected_eggs INT DEFAULT 0,
      broken_eggs INT DEFAULT 0,
      henday_percentage NUMERIC(5, 2),
      recorded_by VARCHAR(128),
      raw_record JSONB,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_egg_date ON egg_collections(date);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_egg_flock ON egg_collections(flock_id);`;

  // 5. Feed Records Table
  await sql`
    CREATE TABLE IF NOT EXISTS feed_records (
      id VARCHAR(128) PRIMARY KEY,
      flock_id VARCHAR(128),
      date DATE NOT NULL,
      feed_type VARCHAR(100),
      quantity_kg NUMERIC(10, 2) DEFAULT 0,
      feed_males_kg NUMERIC(10, 2) DEFAULT 0,
      feed_females_kg NUMERIC(10, 2) DEFAULT 0,
      recorded_by VARCHAR(128),
      raw_record JSONB,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_feed_date ON feed_records(date);`;

  // 6. Depletions (Mortality & Culls)
  await sql`
    CREATE TABLE IF NOT EXISTS depletions (
      id VARCHAR(128) PRIMARY KEY,
      flock_id VARCHAR(128),
      date DATE NOT NULL,
      type VARCHAR(50) NOT NULL,
      males_count INT DEFAULT 0,
      females_count INT DEFAULT 0,
      reason TEXT,
      recorded_by VARCHAR(128),
      raw_record JSONB,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_depletions_date ON depletions(date);`;

  // 7. Weight Records Table
  await sql`
    CREATE TABLE IF NOT EXISTS weight_records (
      id VARCHAR(128) PRIMARY KEY,
      flock_id VARCHAR(128),
      date DATE NOT NULL,
      age_weeks INT,
      male_avg_weight NUMERIC(8, 2),
      female_avg_weight NUMERIC(8, 2),
      uniformity_pct NUMERIC(5, 2),
      raw_record JSONB,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 8. Biosecurity Logs Table
  await sql`
    CREATE TABLE IF NOT EXISTS biosecurity_logs (
      id VARCHAR(128) PRIMARY KEY,
      date DATE NOT NULL,
      action_type VARCHAR(100),
      area VARCHAR(100),
      verified_by VARCHAR(128),
      status VARCHAR(50),
      raw_record JSONB,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  return {
    success: true,
    message: 'All Neon PostgreSQL schemas and indexes initialized successfully.',
    tables,
  };
}

/**
 * Pushes all farm data into Neon PostgreSQL.
 * Synchronizes both relational tables and the universal JSONB document store.
 */
export async function syncAllToNeon(data: {
  farmProfile?: any;
  flocks?: any[];
  eggRecords?: any[];
  feedRecords?: any[];
  depletions?: any[];
  weightRecords?: any[];
  biosecurityLogs?: any[];
  feedStock?: any[];
  medProducts?: any[];
  medStockLogs?: any[];
  vaccineSchedules?: any[];
  settings?: any;
  standards?: any;
  users?: any[];
}): Promise<{ success: boolean; syncedAt: string; counts: Record<string, number> }> {
  const sql = getNeonClient();

  // Ensure tables exist before inserting
  await initNeonTables();

  const now = new Date().toISOString();
  const counts: Record<string, number> = {};

  // 1. Sync Farm Profile
  if (data.farmProfile) {
    const p = data.farmProfile;
    await sql`
      INSERT INTO farm_profile (
        id, name, address, contact_number, email, established_year,
        industry_sector, facility_houses_count, total_bird_capacity,
        daily_egg_capacity, logo_url, raw_profile, updated_at
      ) VALUES (
        'default', 
        ${p.name || 'FarmFlow Pro'}, 
        ${p.address || ''}, 
        ${p.contactNumber || ''}, 
        ${p.email || ''}, 
        ${String(p.establishedYear || '')}, 
        ${p.industrySector || ''}, 
        ${p.facilityHousesCount || 0}, 
        ${p.totalBirdCapacity || 0}, 
        ${p.dailyEggCapacity || 0}, 
        ${p.logoUrl || null}, 
        ${JSON.stringify(p)}, 
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        contact_number = EXCLUDED.contact_number,
        email = EXCLUDED.email,
        established_year = EXCLUDED.established_year,
        industry_sector = EXCLUDED.industry_sector,
        facility_houses_count = EXCLUDED.facility_houses_count,
        total_bird_capacity = EXCLUDED.total_bird_capacity,
        daily_egg_capacity = EXCLUDED.daily_egg_capacity,
        logo_url = EXCLUDED.logo_url,
        raw_profile = EXCLUDED.raw_profile,
        updated_at = NOW();
    `;
    counts.farmProfile = 1;
  }

  // Helper to upsert a list into farm_kv_store for document durability
  async function upsertKvCollection(collection: string, items?: any[]) {
    if (!items || !items.length) {
      counts[collection] = 0;
      return;
    }
    for (const item of items) {
      const id = String(item.id || item._id || `${collection}_${Date.now()}`);
      await sql`
        INSERT INTO farm_kv_store (collection_name, doc_id, data, updated_at)
        VALUES (${collection}, ${id}, ${JSON.stringify(item)}, NOW())
        ON CONFLICT (collection_name, doc_id) DO UPDATE SET
          data = EXCLUDED.data,
          updated_at = NOW();
      `;
    }
    counts[collection] = items.length;
  }

  // Sync relational & KV representations
  if (data.flocks && data.flocks.length > 0) {
    for (const f of data.flocks) {
      const id = String(f.id);
      await sql`
        INSERT INTO farm_flocks (
          id, flock_name, house_number, breed, current_males, current_females, status, raw_flock, updated_at
        ) VALUES (
          ${id},
          ${f.flockName || f.name || 'House'},
          ${String(f.houseNumber || '')},
          ${f.breed || ''},
          ${f.currentMales || f.maleCount || 0},
          ${f.currentFemales || f.femaleCount || 0},
          ${f.status || 'Active'},
          ${JSON.stringify(f)},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          flock_name = EXCLUDED.flock_name,
          house_number = EXCLUDED.house_number,
          breed = EXCLUDED.breed,
          current_males = EXCLUDED.current_males,
          current_females = EXCLUDED.current_females,
          status = EXCLUDED.status,
          raw_flock = EXCLUDED.raw_flock,
          updated_at = NOW();
      `;
    }
  }

  // Upsert all collections into the resilient KV store
  await upsertKvCollection('flocks', data.flocks);
  await upsertKvCollection('egg_collections', data.eggRecords);
  await upsertKvCollection('feed_records', data.feedRecords);
  await upsertKvCollection('depletions', data.depletions);
  await upsertKvCollection('weight_records', data.weightRecords);
  await upsertKvCollection('biosecurity_logs', data.biosecurityLogs);
  await upsertKvCollection('feed_stock', data.feedStock);
  await upsertKvCollection('med_products', data.medProducts);
  await upsertKvCollection('med_stock_logs', data.medStockLogs);
  await upsertKvCollection('vaccine_schedules', data.vaccineSchedules);
  await upsertKvCollection('users', data.users);

  if (data.settings) {
    await sql`
      INSERT INTO farm_kv_store (collection_name, doc_id, data, updated_at)
      VALUES ('settings', 'default', ${JSON.stringify(data.settings)}, NOW())
      ON CONFLICT (collection_name, doc_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
    `;
    counts.settings = 1;
  }

  if (data.standards) {
    await sql`
      INSERT INTO farm_kv_store (collection_name, doc_id, data, updated_at)
      VALUES ('standards', 'default', ${JSON.stringify(data.standards)}, NOW())
      ON CONFLICT (collection_name, doc_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
    `;
    counts.standards = 1;
  }

  lastNeonSyncTime = now;

  return {
    success: true,
    syncedAt: now,
    counts,
  };
}

/**
 * Pulls all synchronized farm data from Neon PostgreSQL.
 */
export async function pullAllFromNeon(): Promise<{
  success: boolean;
  data: {
    farmProfile?: any;
    flocks?: any[];
    eggRecords?: any[];
    feedRecords?: any[];
    depletions?: any[];
    weightRecords?: any[];
    biosecurityLogs?: any[];
    feedStock?: any[];
    medProducts?: any[];
    medStockLogs?: any[];
    vaccineSchedules?: any[];
    settings?: any;
    standards?: any;
    users?: any[];
  };
  pulledAt: string;
}> {
  const sql = getNeonClient();

  // Ensure table exists
  await initNeonTables();

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
    feed_stock: [],
    med_products: [],
    med_stock_logs: [],
    vaccine_schedules: [],
    users: [],
  };

  let farmProfile: any = null;
  let settings: any = null;
  let standards: any = null;

  for (const row of rows) {
    const col = row.collection_name;
    const docData = row.data;

    if (col === 'settings') {
      settings = docData;
    } else if (col === 'standards') {
      standards = docData;
    } else if (col === 'farm_profile') {
      farmProfile = docData;
    } else if (result[col]) {
      result[col].push(docData);
    }
  }

  // Also check relational farm_profile table
  if (!farmProfile) {
    const profileRows = await sql`SELECT raw_profile FROM farm_profile WHERE id = 'default' LIMIT 1`;
    if (profileRows && profileRows[0]?.raw_profile) {
      farmProfile = profileRows[0].raw_profile;
    }
  }

  return {
    success: true,
    pulledAt: new Date().toISOString(),
    data: {
      farmProfile,
      flocks: result.flocks,
      eggRecords: result.egg_collections,
      feedRecords: result.feed_records,
      depletions: result.depletions,
      weightRecords: result.weight_records,
      biosecurityLogs: result.biosecurity_logs,
      feedStock: result.feed_stock,
      medProducts: result.med_products,
      medStockLogs: result.med_stock_logs,
      vaccineSchedules: result.vaccine_schedules,
      settings,
      standards,
      users: result.users,
    },
  };
}
