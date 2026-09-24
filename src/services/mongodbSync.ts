/**
 * Client service for connecting FarmFlow Pro directly to MongoDB.
 * Replaces persistent browser storage with MongoDB cloud database connection.
 */
import { sanitizePayload, isSafeIdentifier } from '../utils/sanitizer';

export interface MongoSyncStatus {
  connected: boolean;
  dbName: string;
  uriConfigured: boolean;
  serverInfo?: string;
  lastSyncedAt?: string | null;
  error?: string | null;
  collections?: { name: string; count: number }[];
}

const DEFAULT_STATUS: MongoSyncStatus = {
  connected: false,
  dbName: 'farmflowproviii',
  uriConfigured: true,
  serverInfo: 'Connecting to MongoDB...',
  lastSyncedAt: null,
};

export async function getMongoDBStatus(): Promise<MongoSyncStatus> {
  try {
    const res = await fetch('/api/mongodb/status', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      return {
        ...DEFAULT_STATUS,
        connected: false,
        error: `Server responded with ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    return {
      connected: !!data.connected,
      dbName: data.dbName || 'farmflowproviii',
      uriConfigured: data.uriConfigured ?? true,
      serverInfo: data.serverInfo || 'MongoDB Production Cluster Active & Ready',
      lastSyncedAt: data.connected ? new Date().toISOString() : null,
      collections: data.collections || [],
      error: data.error || null,
    };
  } catch (err: any) {
    return {
      ...DEFAULT_STATUS,
      connected: false,
      error: err.message || 'Network error reaching MongoDB endpoint',
    };
  }
}

export async function pullAllDataFromMongoDB(): Promise<{
  success: boolean;
  data?: any;
  message?: string;
}> {
  try {
    const res = await fetch('/api/mongodb/pull', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to pull data from MongoDB (${res.status} ${res.statusText})`);
    }

    const json = await res.json();
    return {
      success: true,
      data: json.data,
      message: 'MongoDB collections retrieved successfully.',
    };
  } catch (err: any) {
    console.warn('[MongoDB Client] Pull error:', err.message);
    return {
      success: false,
      message: err.message || 'Error pulling data from MongoDB',
    };
  }
}

export async function syncAllDataToMongoDB(payload: any): Promise<{
  success: boolean;
  counts?: any;
  message: string;
}> {
  try {
    const sanitizedPayload = sanitizePayload(payload);
    const res = await fetch('/api/mongodb/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(sanitizedPayload),
    });

    if (!res.ok) {
      throw new Error(`MongoDB sync failed (${res.status} ${res.statusText})`);
    }

    const json = await res.json();
    return {
      success: true,
      counts: json.counts,
      message: json.message || 'All records successfully synchronized to MongoDB.',
    };
  } catch (err: any) {
    console.error('[MongoDB Client] Sync error:', err.message);
    return {
      success: false,
      message: err.message || 'Failed to sync with MongoDB database',
    };
  }
}

export async function saveDocToMongoDB(
  collectionName: string,
  id: string,
  data: any
): Promise<boolean> {
  try {
    const cleanId = String(id).trim();
    if (!isSafeIdentifier(cleanId)) {
      console.warn('[Security] Refused to save document with unsafe ID:', id);
      return false;
    }
    const cleanData = sanitizePayload(data);
    const res = await fetch(`/api/mongodb/doc/${encodeURIComponent(collectionName)}/${encodeURIComponent(cleanId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(cleanData),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[MongoDB Client] Save doc error (${collectionName}/${id}):`, err);
    return false;
  }
}

export async function deleteDocFromMongoDB(
  collectionName: string,
  id: string
): Promise<boolean> {
  try {
    const cleanId = String(id).trim();
    if (!isSafeIdentifier(cleanId)) {
      console.warn('[Security] Refused to delete document with unsafe ID:', id);
      return false;
    }
    const res = await fetch(`/api/mongodb/doc/${encodeURIComponent(collectionName)}/${encodeURIComponent(cleanId)}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
    return res.ok;
  } catch (err) {
    console.warn(`[MongoDB Client] Delete doc error (${collectionName}/${id}):`, err);
    return false;
  }
}

export async function saveFarmProfileToMongoDB(profile: any): Promise<{ success: boolean; message: string }> {
  try {
    const cleanProfile = sanitizePayload(profile);
    const res = await fetch('/api/mongodb/farm-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(cleanProfile),
    });
    const json = await res.json();
    return {
      success: res.ok,
      message: json.message || 'Farm Profile saved directly to MongoDB.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to update farm profile in MongoDB',
    };
  }
}

export async function getFarmProfileFromMongoDB(): Promise<any | null> {
  try {
    const res = await fetch('/api/mongodb/farm-profile', {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export function startMongoDBPolling(callback: () => void, intervalMs: number = 30000): () => void {
  const intervalId = setInterval(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    callback();
  }, intervalMs);

  return () => clearInterval(intervalId);
}
