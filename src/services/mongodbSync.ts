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
      let errorMsg = `Server responded with ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson?.message) errorMsg = errJson.message;
        else if (errJson?.error) errorMsg = errJson.error;
      } catch {
        // use fallback
      }
      return {
        ...DEFAULT_STATUS,
        connected: false,
        error: errorMsg,
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
  const cleanId = String(id).trim();
  if (!isSafeIdentifier(cleanId)) {
    console.warn('[Security] Refused to save document with unsafe ID:', id);
    return false;
  }
  const cleanData = sanitizePayload(data);

  // Attempt save with up to 1 automatic retry
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(`/api/mongodb/doc/${encodeURIComponent(collectionName)}/${encodeURIComponent(cleanId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(cleanData),
      });
      if (res.ok) {
        return true;
      }
      console.warn(`[MongoDB Client] Save doc attempt ${attempt} returned status ${res.status} for ${collectionName}/${cleanId}`);
    } catch (err) {
      console.warn(`[MongoDB Client] Save doc attempt ${attempt} network error (${collectionName}/${id}):`, err);
    }
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 400));
    }
  }
  return false;
}

export async function deleteDocFromMongoDB(
  collectionName: string,
  id: string
): Promise<boolean> {
  const cleanId = String(id).trim();
  if (!isSafeIdentifier(cleanId)) {
    console.warn('[Security] Refused to delete document with unsafe ID:', id);
    return false;
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(`/api/mongodb/doc/${encodeURIComponent(collectionName)}/${encodeURIComponent(cleanId)}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn(`[MongoDB Client] Delete doc attempt ${attempt} error (${collectionName}/${id}):`, err);
    }
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 400));
    }
  }
  return false;
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
    callback();
  }, intervalMs);

  return () => clearInterval(intervalId);
}

export async function purgeOldDataFromMongoDB(options?: {
  collections?: string[];
  preserveUsers?: boolean;
  preserveStandards?: boolean;
  preserveFarmProfile?: boolean;
}): Promise<{ success: boolean; cleared?: Record<string, number>; message: string }> {
  try {
    const res = await fetch('/api/mongodb/purge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(options || {}),
    });
    const json = await res.json();
    return {
      success: res.ok && json.success,
      cleared: json.cleared,
      message: json.message || json.error || 'Purge completed.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to call purge endpoint.',
    };
  }
}

export async function clearAllLocalCacheAndStorage(): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') {
      const activeUser = localStorage.getItem('broiler_breeder_active_user');
      localStorage.clear();
      if (activeUser) {
        localStorage.setItem('broiler_breeder_active_user', activeUser);
      }
    }
  } catch {}

  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  } catch {}

  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map(k => window.caches.delete(k)));
    }
  } catch {}
}

export async function reconnectMongoDB(): Promise<{
  success: boolean;
  message: string;
  status?: MongoSyncStatus;
}> {
  try {
    const res = await fetch('/api/db/reconnect', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
    const data = await res.json();
    return {
      success: !!data.success,
      message: data.message || (data.success ? 'Connected to MongoDB Atlas' : 'Connection failed'),
      status: data.status,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Reconnect request failed',
    };
  }
}
