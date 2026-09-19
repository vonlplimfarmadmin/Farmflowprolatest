export interface NeonSyncStatus {
  connected: boolean;
  database: string;
  host: string;
  version?: string;
  latencyMs?: number;
  tablesCount?: number;
  uriConfigured: boolean;
  error?: string | null;
  lastSyncedAt?: string | null;
  isSyncing?: boolean;
}

export async function getNeonStatus(): Promise<NeonSyncStatus> {
  try {
    const res = await fetch('/api/neon/status', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      connected: Boolean(data.connected),
      database: data.database || 'neondb',
      host: data.host || 'neon.tech',
      version: data.version,
      latencyMs: data.latencyMs,
      tablesCount: data.tablesCount,
      uriConfigured: Boolean(data.uriConfigured),
      error: data.error || null,
      lastSyncedAt: data.lastSyncedAt || null,
    };
  } catch (err: any) {
    return {
      connected: false,
      database: 'neondb',
      host: 'neon.tech',
      uriConfigured: false,
      error: err?.message || 'Failed to query Neon PostgreSQL endpoint',
      lastSyncedAt: null,
    };
  }
}

/**
 * Initializes tables and schemas in Neon PostgreSQL
 */
export async function initNeonTables(): Promise<{ success: boolean; message: string; tables?: string[] }> {
  const res = await fetch('/api/neon/init-tables', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

/**
 * Push all farm data to Neon PostgreSQL
 */
export async function syncAllDataToNeon(data: any): Promise<{
  success: boolean;
  syncedAt?: string;
  counts?: Record<string, number>;
  message?: string;
}> {
  const res = await fetch('/api/neon/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `HTTP ${res.status} error during Neon sync`);
  }
  return res.json();
}

/**
 * Pull all farm data from Neon PostgreSQL
 */
export async function pullAllDataFromNeon(): Promise<{
  success: boolean;
  data?: any;
  pulledAt?: string;
  message?: string;
}> {
  const res = await fetch('/api/neon/pull', {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `HTTP ${res.status} error during Neon pull`);
  }
  return res.json();
}

/**
 * Test a custom or existing Neon PostgreSQL connection string
 */
export async function testNeonConnection(customUrl?: string): Promise<{
  success: boolean;
  message: string;
  status: NeonSyncStatus;
}> {
  const res = await fetch('/api/neon/test-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ connectionString: customUrl }),
  });
  return res.json();
}
