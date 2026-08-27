import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  writeBatch,
  getDoc,
  deleteDoc,
  onSnapshot,
  query,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

export interface FirestoreSyncStatus {
  connected: boolean;
  dbName: string;
  projectId: string;
  lastSyncedAt: string | null;
  error?: string | null;
}

/**
 * Upload all current farm data into Firebase Firestore collections
 */
export async function syncAllDataToFirestore(data: {
  eggRecords: any[];
  flocks: any[];
  feedRecords: any[];
  farmProfile: any;
  depletions: any[];
  medAdmins: any[];
  bodyWeights: any[];
  biosecurityLogs: any[];
  users: any[];
}): Promise<{ success: boolean; message: string; counts?: Record<string, number> }> {
  try {
    const counts: Record<string, number> = {
      eggRecords: 0,
      flocks: 0,
      feedRecords: 0,
      depletions: 0,
      medAdmins: 0,
      bodyWeights: 0,
      biosecurityLogs: 0,
      users: 0,
    };

    // Save Farm Profile
    if (data.farmProfile) {
      const profileRef = doc(db, 'farm_config', 'profile');
      await setDoc(profileRef, {
        ...data.farmProfile,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    // Helper for batched writes
    const batchUpload = async (collectionName: string, items: any[], getId: (item: any) => string) => {
      if (!items || items.length === 0) return 0;
      let count = 0;
      const chunks: any[][] = [];
      for (let i = 0; i < items.length; i += 400) {
        chunks.push(items.slice(i, i + 400));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        for (const item of chunk) {
          const docId = getId(item);
          if (docId) {
            const docRef = doc(db, collectionName, String(docId));
            batch.set(docRef, item, { merge: true });
            count++;
          }
        }
        await batch.commit();
      }
      return count;
    };

    // 1. Egg Records
    counts.eggRecords = await batchUpload('eggRecords', data.eggRecords || [], (r) => r.id);

    // 2. Flocks
    counts.flocks = await batchUpload('flocks', data.flocks || [], (f) => f.id || f.houseNumber);

    // 3. Feed Records
    counts.feedRecords = await batchUpload('feedRecords', data.feedRecords || [], (f) => f.id);

    // 4. Depletions
    counts.depletions = await batchUpload('depletions', data.depletions || [], (d) => d.id);

    // 5. Medication Administrations
    counts.medAdmins = await batchUpload('medAdmins', data.medAdmins || [], (m) => m.id);

    // 6. Body Weights
    counts.bodyWeights = await batchUpload('bodyWeights', data.bodyWeights || [], (w) => w.id);

    // 7. Biosecurity
    counts.biosecurityLogs = await batchUpload('biosecurityLogs', data.biosecurityLogs || [], (b) => b.id || `${b.requirementId}_${b.date}`);

    // 8. Users
    counts.users = await batchUpload('users', data.users || [], (u) => u.id || u.username);

    return {
      success: true,
      message: `Successfully synchronized data to Firebase Firestore.`,
      counts,
    };
  } catch (error: any) {
    console.error('Firestore sync error:', error);
    return {
      success: false,
      message: error?.message || 'Failed to sync with Firebase Firestore.',
    };
  }
}

/**
 * Pull all farm data from Firebase Firestore collections
 */
export async function pullAllDataFromFirestore(): Promise<{
  success: boolean;
  message: string;
  data?: {
    eggRecords: any[];
    flocks: any[];
    feedRecords: any[];
    farmProfile: any;
    depletions: any[];
    medAdmins: any[];
    bodyWeights: any[];
    biosecurityLogs: any[];
    users: any[];
  };
}> {
  try {
    const fetchCollection = async (collName: string) => {
      const snap = await getDocs(collection(db, collName));
      return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    };

    const [
      eggRecords,
      flocks,
      feedRecords,
      depletions,
      medAdmins,
      bodyWeights,
      biosecurityLogs,
      users,
    ] = await Promise.all([
      fetchCollection('eggRecords'),
      fetchCollection('flocks'),
      fetchCollection('feedRecords'),
      fetchCollection('depletions'),
      fetchCollection('medAdmins'),
      fetchCollection('bodyWeights'),
      fetchCollection('biosecurityLogs'),
      fetchCollection('users'),
    ]);

    let farmProfile = null;
    try {
      const profileSnap = await getDoc(doc(db, 'farm_config', 'profile'));
      if (profileSnap.exists()) {
        farmProfile = profileSnap.data();
      }
    } catch {
      // ignore
    }

    return {
      success: true,
      message: 'Successfully pulled latest records from Firebase Firestore.',
      data: {
        eggRecords,
        flocks,
        feedRecords,
        depletions,
        medAdmins,
        bodyWeights,
        biosecurityLogs,
        users,
        farmProfile,
      }
    };
  } catch (error: any) {
    console.error('Firestore pull error:', error);
    return {
      success: false,
      message: error?.message || 'Failed to pull data from Firebase Firestore.',
    };
  }
}

/**
 * Save single document quickly to Firestore (for real-time logging)
 */
export async function saveDocToFirestore(collectionName: string, id: string, data: any) {
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (e) {
    console.warn(`Firestore save error in [${collectionName}]:`, e);
    return false;
  }
}

/**
 * Delete a document from Firestore
 */
export async function deleteDocFromFirestore(collectionName: string, id: string) {
  try {
    await deleteDoc(doc(db, collectionName, id));
    return true;
  } catch (e) {
    console.warn(`Firestore delete error in [${collectionName}]:`, e);
    return false;
  }
}

/**
 * Real-time Auto-Sync Subscriptions for all Farm Collections
 */
export interface FirestoreSubscriptions {
  onEggRecordsUpdate?: (records: any[]) => void;
  onFlocksUpdate?: (flocks: any[]) => void;
  onFeedRecordsUpdate?: (feedRecords: any[]) => void;
  onDepletionsUpdate?: (depletions: any[]) => void;
  onMedAdminsUpdate?: (medAdmins: any[]) => void;
  onBodyWeightsUpdate?: (bodyWeights: any[]) => void;
  onBiosecurityLogsUpdate?: (logs: any[]) => void;
  onUsersUpdate?: (users: any[]) => void;
  onFarmProfileUpdate?: (profile: any) => void;
  onError?: (err: any) => void;
}

export function subscribeToFarmCollections(subs: FirestoreSubscriptions): () => void {
  const unsubs: (() => void)[] = [];

  try {
    // 1. Egg Records
    if (subs.onEggRecordsUpdate) {
      const unsub = onSnapshot(collection(db, 'eggRecords'), (snap) => {
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
          subs.onEggRecordsUpdate!(docs);
        }
      }, (err) => subs.onError?.(err));
      unsubs.push(unsub);
    }

    // 2. Flocks
    if (subs.onFlocksUpdate) {
      const unsub = onSnapshot(collection(db, 'flocks'), (snap) => {
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
          subs.onFlocksUpdate!(docs);
        }
      }, (err) => subs.onError?.(err));
      unsubs.push(unsub);
    }

    // 3. Feed Records
    if (subs.onFeedRecordsUpdate) {
      const unsub = onSnapshot(collection(db, 'feedRecords'), (snap) => {
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
          subs.onFeedRecordsUpdate!(docs);
        }
      }, (err) => subs.onError?.(err));
      unsubs.push(unsub);
    }

    // 4. Depletions
    if (subs.onDepletionsUpdate) {
      const unsub = onSnapshot(collection(db, 'depletions'), (snap) => {
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
          subs.onDepletionsUpdate!(docs);
        }
      }, (err) => subs.onError?.(err));
      unsubs.push(unsub);
    }

    // 5. Medication Administrations
    if (subs.onMedAdminsUpdate) {
      const unsub = onSnapshot(collection(db, 'medAdmins'), (snap) => {
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
          subs.onMedAdminsUpdate!(docs);
        }
      }, (err) => subs.onError?.(err));
      unsubs.push(unsub);
    }

    // 6. Body Weights
    if (subs.onBodyWeightsUpdate) {
      const unsub = onSnapshot(collection(db, 'bodyWeights'), (snap) => {
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
          subs.onBodyWeightsUpdate!(docs);
        }
      }, (err) => subs.onError?.(err));
      unsubs.push(unsub);
    }

    // 7. Biosecurity Logs
    if (subs.onBiosecurityLogsUpdate) {
      const unsub = onSnapshot(collection(db, 'biosecurityLogs'), (snap) => {
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
          subs.onBiosecurityLogsUpdate!(docs);
        }
      }, (err) => subs.onError?.(err));
      unsubs.push(unsub);
    }

    // 8. Users
    if (subs.onUsersUpdate) {
      const unsub = onSnapshot(collection(db, 'users'), (snap) => {
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
          subs.onUsersUpdate!(docs);
        }
      }, (err) => subs.onError?.(err));
      unsubs.push(unsub);
    }

    // 9. Farm Profile
    if (subs.onFarmProfileUpdate) {
      const unsub = onSnapshot(doc(db, 'farm_config', 'profile'), (snap) => {
        if (snap.exists()) {
          subs.onFarmProfileUpdate!(snap.data());
        }
      }, (err) => subs.onError?.(err));
      unsubs.push(unsub);
    }
  } catch (e) {
    console.warn('Failed to register some Firestore listeners:', e);
  }

  return () => {
    unsubs.forEach(u => {
      try {
        u();
      } catch (e) {
        // ignore
      }
    });
  };
}
