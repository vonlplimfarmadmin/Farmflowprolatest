import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  UserAccount, 
  UserRole, 
  UserStatus,
  FarmProfile, 
  Flock, 
  FeedStockEntry, 
  FeedConsumptionRecord, 
  DepletionRecord, 
  MedProduct, 
  MedAdministrationRecord, 
  MedStockLog, 
  BodyWeightRecord, 
  EggProductionRecord, 
  WeeklyEggWeightRecord, 
  SystemLog, 
  FeedType,
  StandardMedProgramItem,
  StandardFeedGuideItem,
  StandardHendayItem,
  StandardBodyWeightItem,
  StandardEggWeightItem,
  BirdTransferRecord,
  BiosecurityRequirement,
  BiosecurityVerificationLog,
  BiosecurityDailySummary,
  BiosecurityStatus,
  BiosecurityCategory,
  BiosecurityFrequency,
  BiosecurityCriticalLevel
} from '../types';
import { 
  INITIAL_FARM_PROFILE, 
  INITIAL_USERS, 
  INITIAL_FLOCKS, 
  INITIAL_FEED_STOCK, 
  INITIAL_FEED_CONSUMPTION, 
  INITIAL_DEPLETIONS, 
  INITIAL_BIRD_TRANSFERS,
  INITIAL_MED_PRODUCTS, 
  INITIAL_MED_ADMIN, 
  INITIAL_BODY_WEIGHTS, 
  INITIAL_EGG_PRODUCTION, 
  INITIAL_WEEKLY_EGG_WEIGHTS, 
  INITIAL_SYSTEM_LOGS,
  INITIAL_BIOSECURITY_REQUIREMENTS,
  INITIAL_BIOSECURITY_LOGS,
  INITIAL_BIOSECURITY_SUMMARIES
} from '../data/initialData';
import { calculateFlockAgeFromLoadingDate } from '../utils/dateCalculations';
import { detectPlatform } from '../utils/platform';
import {
  OfflineQueueItem,
  StorageQuotaInfo,
  saveCollectionToIndexedDB,
  saveAllCollectionsToIndexedDB,
  loadAllCollectionsFromIndexedDB,
  enqueueOfflineAction,
  getOfflineQueueFromIndexedDB,
  clearOfflineQueue,
  getStorageQuotaInfo
} from '../services/indexedDBStorage';

export interface PermissionCheck {
  canViewModule: (moduleId: string) => boolean;
  canEditRecord: boolean;
  canDeleteRecord: boolean;
  canApproveUsers: boolean;
  canManageUsers: boolean;
  canManageFarmProfile: boolean;
  canManageMedicines: boolean;
  canManageBiosecurityRequirements: boolean;
  canVerifyBiosecurity: boolean;
  canRecordEggProduction: (houseNumber?: string) => boolean;
  canRecordFlockmanModule: (houseNumber?: string) => boolean;
  canRecordMortality: (houseNumber?: string) => boolean;
  canAddFeedStock: boolean;
  canAddMedicine: boolean;
  canAddFlock: boolean;
}

export interface FeedStockSummaryItem {
  feedType: FeedType;
  totalReceivedKg: number;
  totalReceivedBags: number;
  totalConsumedKg: number;
  currentStockKg: number;
  currentStockBags: number;
  isLowStock: boolean; // <= 4 bags (200 kg)
}

export interface FlockStats {
  flock: Flock;
  ageWeeks: number;
  ageDays?: number;
  totalDaysFromLoading?: number;
  weekAndDayStr?: string;
  currentMales: number;
  currentFemales: number;
  totalCurrent: number;
  initialTotal: number;
  livabilityPct: number;
  maleToFemaleRatioStr: string;
  maleRatioPct: number;
  totalMaleDepleted: number;
  totalFemaleDepleted: number;
  totalDepleted: number;
}

export interface VaccineAlert {
  id: string;
  houseNumber: string;
  flockAgeWeeks: number;
  scheduledWeek: number;
  productName: string;
  diseaseTarget: string;
  method: string;
  urgency: 'due_now' | 'upcoming';
}

export interface NormalizedEggProductionRecord extends EggProductionRecord {
  totalEggs: number;
  totalHatchingEggs: number;
  totalNonHatchingEggs: number;
  hatchingEggPct: number;
  nonHatchingEggPct: number;
  hendayPct: number;
  femalePopulationAtDate: number;
  sampleEggWeightGrams: number;
}

interface FarmContextType {
  // Auth & User
  currentUser: UserAccount | null;
  users: UserAccount[];
  login: (username: string, password?: string) => { success: boolean; message: string; user?: UserAccount };
  logout: () => void;
  registerUser: (userData: Omit<UserAccount, 'id' | 'createdAt' | 'status'> & { password?: string }, autoActivate?: boolean) => { success: boolean; message: string; user?: UserAccount };
  recoverAccount: (username: string, answer: string, newPassword?: string) => { success: boolean; message: string };
  approveUser: (userId: string, designatedHouses?: string[]) => void;
  rejectUser: (userId: string) => void;
  updateUserRole: (userId: string, newRole: UserRole, houses?: string[]) => void;
  updateUserStatus: (userId: string, newStatus: UserStatus) => void;
  assignUserHouses: (userId: string, houses: string[]) => void;
  deleteUser: (userId: string) => void;
  switchUser: (userId: string) => void;
  switchUserRole: (role: UserRole) => void;

  // Farm Profile
  farmProfile: FarmProfile;
  updateFarmProfile: (profile: Partial<FarmProfile>) => void;
  updateStandardVaccination: (program: StandardMedProgramItem[]) => void;
  updateStandardFeedGuide: (guide: StandardFeedGuideItem[]) => void;
  updateStandardHenday: (henday: StandardHendayItem[]) => void;
  updateStandardBodyWeights: (weights: StandardBodyWeightItem[]) => void;
  updateStandardEggWeights: (eggWeights: StandardEggWeightItem[]) => void;

  // Flocks & Transfers
  flocks: Flock[];
  addFlock: (flock: Omit<Flock, 'id' | 'currentMales' | 'currentFemales'>) => void;
  updateFlock: (id: string, updates: Partial<Flock>) => void;
  deleteFlock: (id: string) => void;
  getFlockStats: (houseNumber: string, referenceDate?: string) => FlockStats | null;
  transfers: BirdTransferRecord[];
  addTransfer: (transfer: Omit<BirdTransferRecord, 'id' | 'createdAt' | 'loggedBy'>) => { success: boolean; message: string };
  deleteTransfer: (id: string, revertCounts?: boolean) => void;

  // Feed Inventory
  feedStockEntries: FeedStockEntry[];
  feedConsumptionRecords: FeedConsumptionRecord[];
  addFeedStock: (entry: Omit<FeedStockEntry, 'id' | 'totalKg' | 'createdAt'>) => void;
  deleteFeedStock: (id: string) => void;
  addFeedConsumption: (record: Omit<FeedConsumptionRecord, 'id' | 'createdAt' | 'loggedBy'>) => void;
  deleteFeedConsumption: (id: string) => void;
  getFeedStockSummary: () => FeedStockSummaryItem[];
  getLowStockAlerts: () => FeedStockSummaryItem[];

  // Depletions & Mortality
  depletions: DepletionRecord[];
  addDepletion: (record: Omit<DepletionRecord, 'id' | 'createdAt' | 'loggedBy'>) => void;
  deleteDepletion: (id: string) => void;

  // Medicine & Vaccines
  medProducts: MedProduct[];
  medStockLogs: MedStockLog[];
  medAdministrations: MedAdministrationRecord[];
  addMedProduct: (product: Omit<MedProduct, 'id'>) => void;
  updateMedProduct: (id: string, updates: Partial<MedProduct>) => void;
  deleteMedProduct: (id: string) => void;
  addMedStock: (productId: string, unitsAdded: number, date: string, lotNumber?: string, notes?: string) => void;
  addMedAdministration: (record: Omit<MedAdministrationRecord, 'id' | 'createdAt' | 'loggedBy'>) => void;
  deleteMedAdministration: (id: string) => void;
  getUpcomingVaccines: () => VaccineAlert[];
  getUpcomingVaccineAlerts: () => VaccineAlert[];

  // Body Weight
  bodyWeights: BodyWeightRecord[];
  addBodyWeightRecord: (record: Omit<BodyWeightRecord, 'id' | 'createdAt' | 'loggedBy'>) => void;
  deleteBodyWeightRecord: (id: string) => void;

  // Egg Production
  eggProductionRecords: NormalizedEggProductionRecord[];
  weeklyEggWeights: WeeklyEggWeightRecord[];
  addEggProductionRecord: (record: Partial<EggProductionRecord> & { houseNumber: string; date: string }) => void;
  deleteEggProductionRecord: (id: string) => void;
  addWeeklyEggWeight: (record: Omit<WeeklyEggWeightRecord, 'id' | 'createdAt' | 'loggedBy'>) => void;
  deleteWeeklyEggWeight: (id: string) => void;

  // Biosecurity Compliance
  biosecurityRequirements: BiosecurityRequirement[];
  biosecurityLogs: BiosecurityVerificationLog[];
  biosecuritySummaries: Record<string, BiosecurityDailySummary>;
  addBiosecurityRequirement: (req: Omit<BiosecurityRequirement, 'id' | 'createdAt'>) => void;
  updateBiosecurityRequirement: (id: string, updates: Partial<BiosecurityRequirement>) => void;
  deleteBiosecurityRequirement: (id: string) => void;
  toggleBiosecurityRequirementActive: (id: string) => void;
  toggleBiosecurityLog: (requirementId: string, date: string, status?: BiosecurityStatus, notes?: string, correctiveAction?: string) => void;
  batchVerifyAllBiosecurity: (date: string, status?: BiosecurityStatus) => void;
  signoffBiosecurityDaily: (date: string, supervisorNotes?: string) => void;
  getBiosecurityDailyStats: (date: string) => {
    total: number;
    verified: number;
    passed: number;
    failed: number;
    naCount: number;
    compliancePct: number;
    isSignedOff: boolean;
    signedOffBy?: string;
    signedOffAt?: string;
    supervisorNotes?: string;
  };

  // System Logs & Backup
  systemLogs: SystemLog[];
  auditLogs: SystemLog[];
  logAction: (action: string, category: SystemLog['category'], details: string, houseNumber?: string) => void;
  resetAllDataToDefaults: () => void;
  clearDatabaseForNewCycle: () => Promise<{ success: boolean; message: string }>;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;

  // MongoDB Cloud Persistence (Auto for Mobile & Enterprise)
  isMobileDevice: boolean;
  databaseEngine: 'mongodb' | 'indexeddb';
  dbStatus: {
    connected: boolean;
    state: string;
    dbName: string | null;
    hasUriConfigured: boolean;
    lastError?: string | null;
    isAutoMobileDB?: boolean;
    stats?: {
      eggRecordsCount: number;
      flocksCount: number;
      feedRecordsCount: number;
      depletionsCount?: number;
      medAdminsCount?: number;
      bodyWeightsCount?: number;
      biosecurityLogsCount?: number;
    };
  };
  checkDBStatus: () => Promise<void>;
  reconnectDB: (uri?: string) => Promise<{ success: boolean; message?: string }>;
  syncAllToMongoDB: () => Promise<{ success: boolean; message: string; counts?: any }>;
  pullAllFromMongoDB: () => Promise<{ success: boolean; message: string }>;

  // Offline & IndexedDB Caching Engine
  isOnline: boolean;
  offlineQueue: OfflineQueueItem[];
  pendingOfflineCount: number;
  storageQuota: StorageQuotaInfo;
  refreshStorageQuota: () => Promise<void>;
  syncOfflineQueue: () => Promise<{ success: boolean; syncedCount: number; message: string }>;
  clearOfflineSyncQueue: () => Promise<void>;
  lastIndexedDBSync: string | null;

  // Permission Helpers
  permissions: PermissionCheck;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'broiler_breeder_farm_data_v2';

export const FarmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial states from LocalStorage or defaults (new users see login/register screen first)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('broiler_breeder_active_user');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.username) {
          return parsed;
        }
      } catch { /* ignore */ }
    }
    return null; // Require login or registration first
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [farmProfile, setFarmProfile] = useState<FarmProfile>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_profile`);
    return saved ? JSON.parse(saved) : INITIAL_FARM_PROFILE;
  });

  const [flocks, setFlocks] = useState<Flock[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_flocks`);
    return saved ? JSON.parse(saved) : INITIAL_FLOCKS;
  });

  const [feedStockEntries, setFeedStockEntries] = useState<FeedStockEntry[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_feed_stock`);
    return saved ? JSON.parse(saved) : INITIAL_FEED_STOCK;
  });

  const [feedConsumptionRecords, setFeedConsumptionRecords] = useState<FeedConsumptionRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_feed_cons`);
    return saved ? JSON.parse(saved) : INITIAL_FEED_CONSUMPTION;
  });

  const [depletions, setDepletions] = useState<DepletionRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_depletions`);
    return saved ? JSON.parse(saved) : INITIAL_DEPLETIONS;
  });

  const [transfers, setTransfers] = useState<BirdTransferRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_transfers`);
    return saved ? JSON.parse(saved) : INITIAL_BIRD_TRANSFERS;
  });

  const [medProducts, setMedProducts] = useState<MedProduct[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_med_products`);
    return saved ? JSON.parse(saved) : INITIAL_MED_PRODUCTS;
  });

  const [medStockLogs, setMedStockLogs] = useState<MedStockLog[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_med_stock`);
    return saved ? JSON.parse(saved) : [];
  });

  const [medAdministrations, setMedAdministrations] = useState<MedAdministrationRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_med_admin`);
    return saved ? JSON.parse(saved) : INITIAL_MED_ADMIN;
  });

  const [bodyWeights, setBodyWeights] = useState<BodyWeightRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_body_weights`);
    return saved ? JSON.parse(saved) : INITIAL_BODY_WEIGHTS;
  });

  const [rawEggRecords, setRawEggRecords] = useState<EggProductionRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_egg_prod`);
    return saved ? JSON.parse(saved) : INITIAL_EGG_PRODUCTION;
  });

  const [weeklyEggWeights, setWeeklyEggWeights] = useState<WeeklyEggWeightRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_weekly_egg_weights`);
    return saved ? JSON.parse(saved) : INITIAL_WEEKLY_EGG_WEIGHTS;
  });

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_logs`);
    return saved ? JSON.parse(saved) : INITIAL_SYSTEM_LOGS;
  });

  const [biosecurityRequirements, setBiosecurityRequirements] = useState<BiosecurityRequirement[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_biosecurity_reqs`);
    return saved ? JSON.parse(saved) : INITIAL_BIOSECURITY_REQUIREMENTS;
  });

  const [biosecurityLogs, setBiosecurityLogs] = useState<BiosecurityVerificationLog[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_biosecurity_logs`);
    return saved ? JSON.parse(saved) : INITIAL_BIOSECURITY_LOGS;
  });

  const [biosecuritySummaries, setBiosecuritySummaries] = useState<Record<string, BiosecurityDailySummary>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_biosecurity_summaries`);
    return saved ? JSON.parse(saved) : INITIAL_BIOSECURITY_SUMMARIES;
  });

  // Platform & Mobile Auto-Routing Engine
  const platformInfo = useMemo(() => {
    return detectPlatform();
  }, []);

  const isMobileDevice = useMemo(() => {
    return (
      platformInfo.isMobile || 
      platformInfo.isTablet || 
      (typeof navigator !== 'undefined' && /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)) ||
      (typeof window !== 'undefined' && window.innerWidth <= 768)
    );
  }, [platformInfo]);

  // MongoDB is the default Auto Enterprise Database for Mobile and Cloud
  const [databaseEngine] = useState<'mongodb' | 'indexeddb'>('mongodb');

  // MongoDB Connection State
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    state: string;
    dbName: string | null;
    hasUriConfigured: boolean;
    lastError?: string | null;
    isAutoMobileDB?: boolean;
    stats?: {
      eggRecordsCount: number;
      flocksCount: number;
      feedRecordsCount: number;
      depletionsCount?: number;
      medAdminsCount?: number;
      bodyWeightsCount?: number;
      biosecurityLogsCount?: number;
    };
  }>({
    connected: false,
    state: 'Checking MongoDB...',
    dbName: null,
    hasUriConfigured: false,
    isAutoMobileDB: isMobileDevice,
    stats: { eggRecordsCount: 0, flocksCount: 0, feedRecordsCount: 0 }
  });

  // Offline & IndexedDB Caching Engine State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [lastIndexedDBSync, setLastIndexedDBSync] = useState<string | null>(null);
  const [storageQuota, setStorageQuota] = useState<StorageQuotaInfo>({
    usageMB: 0,
    quotaMB: 0,
    percentUsed: 0,
    indexedDBAvailable: typeof window !== 'undefined' && 'indexedDB' in window,
    itemCounts: {
      flocks: 0,
      eggRecords: 0,
      feedRecords: 0,
      mortalityRecords: 0,
      medRecords: 0,
      biosecurityLogs: 0,
      offlineQueue: 0
    }
  });

  const refreshStorageQuota = async () => {
    try {
      const info = await getStorageQuotaInfo();
      setStorageQuota(info);
      const queue = await getOfflineQueueFromIndexedDB();
      setOfflineQueue(queue);
    } catch {
      // Ignore
    }
  };

  // Monitor Online / Offline Network Status
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      logAction('NETWORK_ONLINE', 'system', 'Network connection restored. Preparing automatic MongoDB synchronization.');
      await checkDBStatus();
      await pullAllFromMongoDB();
      await refreshStorageQuota();
    };

    const handleOffline = () => {
      setIsOnline(false);
      logAction('NETWORK_OFFLINE', 'system', 'Operating in Offline Mode. All changes stored locally in IndexedDB.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial load of offline queue and quota
    getOfflineQueueFromIndexedDB().then(queue => {
      setOfflineQueue(queue);
      refreshStorageQuota();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkDBStatus = async () => {
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus({
          ...data,
          isAutoMobileDB: isMobileDevice
        });
      }
    } catch {
      setDbStatus({
        connected: false,
        state: 'Offline Mode (Local Cache)',
        dbName: null,
        hasUriConfigured: false,
        isAutoMobileDB: isMobileDevice
      });
    }
  };

  const reconnectDB = async (uri?: string) => {
    try {
      const res = await fetch('/api/db/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri })
      });
      const data = await res.json();
      if (data.status) {
        setDbStatus({
          ...data.status,
          isAutoMobileDB: isMobileDevice
        });
      }
      return { success: Boolean(data.success), message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection failed' };
    }
  };

  // Pull All Farm Records from MongoDB (Auto-Hydration on Mobile & Cloud)
  const pullAllFromMongoDB = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/db/pull-all');
      if (!res.ok) {
        return { success: false, message: 'Could not contact MongoDB server endpoint.' };
      }
      const json = await res.json();
      if (json.connected && json.data) {
        const { 
          eggRecords, 
          flocks: remoteFlocks, 
          feedRecords, 
          farmProfile: remoteProfile, 
          depletions: remoteDepletions, 
          medAdmins, 
          bodyWeights: remoteWeights, 
          biosecurityLogs: remoteBio 
        } = json.data;
        
        if (Array.isArray(eggRecords) && eggRecords.length > 0) {
          setRawEggRecords(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const newFromRemote = eggRecords.filter((r: any) => !existingIds.has(r.id));
            return [...newFromRemote, ...prev];
          });
        }
        if (Array.isArray(remoteFlocks) && remoteFlocks.length > 0) {
          setFlocks(prev => {
            const map = new Map<string, Flock>(prev.map(f => [f.houseNumber, f]));
            remoteFlocks.forEach((rf: any) => {
              const existing = map.get(rf.houseNumber);
              map.set(rf.houseNumber, existing ? { ...existing, ...rf } : rf);
            });
            return Array.from(map.values());
          });
        }
        if (Array.isArray(feedRecords) && feedRecords.length > 0) {
          setFeedConsumptionRecords(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const newFromRemote = feedRecords.filter((r: any) => !existingIds.has(r.id));
            return [...newFromRemote, ...prev];
          });
        }
        if (Array.isArray(remoteDepletions) && remoteDepletions.length > 0) {
          setDepletions(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const newFromRemote = remoteDepletions.filter((r: any) => !existingIds.has(r.id));
            return [...newFromRemote, ...prev];
          });
        }
        if (Array.isArray(medAdmins) && medAdmins.length > 0) {
          setMedAdministrations(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const newFromRemote = medAdmins.filter((r: any) => !existingIds.has(r.id));
            return [...newFromRemote, ...prev];
          });
        }
        if (Array.isArray(remoteWeights) && remoteWeights.length > 0) {
          setBodyWeights(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const newFromRemote = remoteWeights.filter((r: any) => !existingIds.has(r.id));
            return [...newFromRemote, ...prev];
          });
        }
        if (Array.isArray(remoteBio) && remoteBio.length > 0) {
          setBiosecurityLogs(prev => {
            const existingIds = new Set(prev.map(r => `${r.requirementId}_${r.date}`));
            const newFromRemote = remoteBio.filter((r: any) => !existingIds.has(`${r.requirementId}_${r.date}`));
            return [...newFromRemote, ...prev];
          });
        }
        if (remoteProfile && typeof remoteProfile === 'object' && 'name' in remoteProfile) {
          setFarmProfile(prev => ({ ...prev, ...(remoteProfile as Partial<FarmProfile>) }));
        }
        if (Array.isArray(json.data.users) && json.data.users.length > 0) {
          setUsers(prev => {
            const map = new Map<string, UserAccount>(prev.map(u => [u.username.toLowerCase(), u]));
            json.data.users.forEach((ru: any) => {
              if (ru && ru.username) {
                const key = ru.username.toLowerCase();
                const existing = map.get(key);
                map.set(key, existing ? { ...existing, ...ru } : ru);
              }
            });
            return Array.from(map.values());
          });
        }

        logAction('MONGODB_AUTO_HYDRATE', 'system', 'Automatically synchronized mobile state from MongoDB Atlas.');
        return { success: true, message: 'Hydrated latest farm records from MongoDB.' };
      }
      return { success: false, message: 'MongoDB not connected or empty' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Error pulling MongoDB data' };
    }
  };

  // Auto-connect and auto-sync on mount
  useEffect(() => {
    const initDatabase = async () => {
      await checkDBStatus();
      // On mobile or online, auto-pull any remote MongoDB updates
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        await pullAllFromMongoDB();
      }
    };
    initDatabase();

    // Set up a background sync interval every 45 seconds when online
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        checkDBStatus();
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [isMobileDevice]);

  // Synchronize Offline Queue
  const syncOfflineQueue = async (): Promise<{ success: boolean; syncedCount: number; message: string }> => {
    try {
      const queue = await getOfflineQueueFromIndexedDB();
      const count = queue.length;

      if (count === 0) {
        return { success: true, syncedCount: 0, message: 'All records are already synchronized.' };
      }

      // If online and MongoDB is available, trigger cloud sync
      if (isOnline && (dbStatus.hasUriConfigured || dbStatus.connected)) {
        await syncAllToMongoDB();
      }

      // Clear the offline queue once persisted
      await clearOfflineQueue();
      setOfflineQueue([]);
      await refreshStorageQuota();

      logAction('SYNC_OFFLINE_QUEUE', 'system', `Successfully synchronized ${count} queued offline operations to MongoDB.`);
      return { 
        success: true, 
        syncedCount: count, 
        message: `Successfully synchronized ${count} offline farm record${count > 1 ? 's' : ''}.` 
      };
    } catch (err: any) {
      return { success: false, syncedCount: 0, message: err?.message || 'Error synchronizing offline queue.' };
    }
  };

  const clearOfflineSyncQueue = async () => {
    await clearOfflineQueue();
    setOfflineQueue([]);
    await refreshStorageQuota();
    logAction('CLEAR_OFFLINE_QUEUE', 'system', 'Cleared pending offline log queue.');
  };

  // Sync All Data to MongoDB
  const syncAllToMongoDB = async () => {
    try {
      const payload = {
        eggRecords: rawEggRecords,
        flocks,
        feedRecords: feedConsumptionRecords,
        farmProfile,
        depletions,
        medAdmins: medAdministrations,
        bodyWeights,
        biosecurityLogs,
        users
      };

      const res = await fetch('/api/db/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await checkDBStatus();
        logAction('MONGODB_SYNC', 'admin', `Successfully synced farm collections to MongoDB.`);
        return { success: true, message: data.message || 'Synced successfully to MongoDB!', counts: data.counts };
      } else {
        return { success: false, message: data.error || 'Failed to sync to MongoDB' };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error syncing with MongoDB' };
    }
  };

  // Dual-tier asynchronous persistence to IndexedDB
  useEffect(() => {
    const saveStateToIndexedDB = async () => {
      try {
        await saveAllCollectionsToIndexedDB({
          users,
          farmProfile,
          flocks,
          feedStockEntries,
          feedConsumptionRecords,
          depletions,
          transfers,
          medProducts,
          medStockLogs,
          medAdministrations,
          bodyWeights,
          rawEggRecords,
          weeklyEggWeights,
          systemLogs,
          biosecurityRequirements,
          biosecurityLogs,
          biosecuritySummaries
        });
        setLastIndexedDBSync(new Date().toISOString());
      } catch (err) {
        console.warn('IndexedDB auto-save non-fatal warning:', err);
      }
    };

    // Trigger IndexedDB sync
    saveStateToIndexedDB();
  }, [
    users,
    farmProfile,
    flocks,
    feedStockEntries,
    feedConsumptionRecords,
    depletions,
    transfers,
    medProducts,
    medStockLogs,
    medAdministrations,
    bodyWeights,
    rawEggRecords,
    weeklyEggWeights,
    systemLogs,
    biosecurityRequirements,
    biosecurityLogs,
    biosecuritySummaries
  ]);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_profile`, JSON.stringify(farmProfile));
  }, [farmProfile]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_flocks`, JSON.stringify(flocks));
  }, [flocks]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_feed_stock`, JSON.stringify(feedStockEntries));
  }, [feedStockEntries]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_feed_cons`, JSON.stringify(feedConsumptionRecords));
  }, [feedConsumptionRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_depletions`, JSON.stringify(depletions));
  }, [depletions]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_transfers`, JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_med_products`, JSON.stringify(medProducts));
  }, [medProducts]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_med_admin`, JSON.stringify(medAdministrations));
  }, [medAdministrations]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_body_weights`, JSON.stringify(bodyWeights));
  }, [bodyWeights]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_egg_prod`, JSON.stringify(rawEggRecords));
  }, [rawEggRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_weekly_egg_weights`, JSON.stringify(weeklyEggWeights));
  }, [weeklyEggWeights]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_logs`, JSON.stringify(systemLogs));
  }, [systemLogs]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_biosecurity_reqs`, JSON.stringify(biosecurityRequirements));
  }, [biosecurityRequirements]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_biosecurity_logs`, JSON.stringify(biosecurityLogs));
  }, [biosecurityLogs]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_biosecurity_summaries`, JSON.stringify(biosecuritySummaries));
  }, [biosecuritySummaries]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('broiler_breeder_active_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // System Audit Logger helper
  const logAction = (action: string, category: SystemLog['category'], details: string, houseNumber?: string) => {
    const newLog: SystemLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System',
      performedBy: currentUser?.fullName || 'System',
      module: category,
      userRole: currentUser?.role || 'admin',
      action,
      category,
      details,
      houseNumber
    };
    setSystemLogs(prev => [newLog, ...prev]);
  };

  // Auth Functions
  const login = (identifier: string, _password?: string) => {
    if (!identifier) {
      return { success: false, message: 'Please enter your username, email address, or staff ID.' };
    }
    const clean = identifier.trim().toLowerCase();
    
    // Multi-attribute lookup: username, email, full name, or user id
    let user = users.find(u => 
      u.username.toLowerCase() === clean ||
      (u.email && u.email.toLowerCase() === clean) ||
      (u.id && u.id.toLowerCase() === clean) ||
      (u.fullName && u.fullName.toLowerCase() === clean)
    );

    // Fallback friendly alias resolution for mobile convenience
    if (!user) {
      if (clean === 'admin' || clean === 'von' || clean === 'vonlim' || clean === 'von.lplimfarm' || clean.includes('von.lplimfarm')) {
        user = users.find(u => u.username === 'admin' || (u.email && u.email.includes('von.lplimfarm')));
      } else if (clean === 'manager' || clean === 'farm_manager' || clean === 'farmmanager') {
        user = users.find(u => u.username === 'farm_mgr_ramon' || u.role === 'Farm Manager');
      } else if (clean === 'flockman' || clean === 'flockman1') {
        user = users.find(u => u.username === 'flockman_joel' || u.role === 'Flockman');
      } else if (clean === 'collector' || clean === 'collector1' || clean === 'egg_collector') {
        user = users.find(u => u.username === 'collector_marlon' || u.role === 'Egg Collector');
      } else if (clean === 'leadman' || clean === 'leadman1') {
        user = users.find(u => u.username === 'leadman_eduardo' || u.role === 'Leadman / Technician');
      }
    }

    if (!user) {
      return { success: false, message: 'User account not found. You can sign in with your email (e.g. von.lplimfarm@gmail.com) or username (e.g. admin).' };
    }
    if (user.status === 'pending') {
      return { success: false, message: 'Your account registration is pending approval by the System Administrator.' };
    }
    if (user.status === 'rejected' || user.status === 'suspended' || user.status === 'disabled') {
      return { success: false, message: 'Account has been deactivated. Please contact your farm administrator.' };
    }
    
    const updated = { ...user, lastLogin: new Date().toISOString() };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
    logAction('USER_LOGIN', 'auth', `User ${user.fullName} logged in successfully as [${user.role}].`);
    return { success: true, message: `Welcome back, ${user.fullName}!`, user: updated };
  };

  const logout = () => {
    if (currentUser) {
      logAction('USER_LOGOUT', 'auth', `User ${currentUser.fullName} logged out.`);
    }
    setCurrentUser(null);
    localStorage.removeItem('broiler_breeder_active_user');
  };

  const registerUser = (userData: Omit<UserAccount, 'id' | 'createdAt' | 'status'> & { password?: string }, autoActivate = false) => {
    const exists = users.some(u => 
      u.username.toLowerCase() === userData.username.toLowerCase().trim() ||
      (userData.email && u.email && u.email.toLowerCase() === userData.email.toLowerCase().trim())
    );
    if (exists) {
      return { success: false, message: 'Username or email already exists. Please choose another.' };
    }

    const newUser: UserAccount = {
      ...userData,
      id: 'usr_' + Date.now(),
      status: autoActivate ? 'active' : 'pending',
      createdAt: new Date().toISOString(),
      registeredAt: new Date().toISOString().split('T')[0],
      designatedHouses: userData.designatedHouses && userData.designatedHouses.length > 0 
        ? userData.designatedHouses 
        : ['House 1', 'House 2']
    };

    setUsers(prev => [...prev, newUser]);

    // Asynchronously save new user to MongoDB
    if (typeof fetch !== 'undefined') {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      }).catch(e => console.warn('Background MongoDB user sync error:', e));
    }

    if (autoActivate) {
      setCurrentUser(newUser);
      logAction('USER_REGISTRATION', 'auth', `New user registered and active: ${newUser.fullName} (${newUser.username}) as [${newUser.role}].`);
      return { 
        success: true, 
        message: `Welcome, ${newUser.fullName}! Your staff account is activated.`,
        user: newUser
      };
    }

    logAction('USER_REGISTRATION', 'auth', `New user registered: ${newUser.fullName} (${newUser.username}) awaiting approval.`);
    return { 
      success: true, 
      message: 'Registration submitted successfully! Your account will be active once approved by the System Administrator.' 
    };
  };

  const recoverAccount = (username: string, answer: string, _newPassword?: string) => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
    if (!user) {
      return { success: false, message: 'Account not found with this username.' };
    }
    if (user.securityAnswer.toLowerCase().trim() !== answer.toLowerCase().trim()) {
      return { success: false, message: 'Security answer does not match our records.' };
    }

    logAction('ACCOUNT_RECOVERY', 'auth', `Account password reset successfully for ${user.username}.`);
    return { 
      success: true, 
      message: `Identity verified for ${user.fullName}. Password has been reset. You may now log in.` 
    };
  };

  const approveUser = (userId: string, designatedHouses?: string[]) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { 
          ...u, 
          status: 'active',
          designatedHouses: designatedHouses || u.designatedHouses 
        };
      }
      return u;
    }));
    const target = users.find(u => u.id === userId);
    logAction('APPROVE_USER', 'admin', `Administrator approved account for ${target?.fullName || userId}.`);
  };

  const rejectUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'rejected' } : u));
    logAction('REJECT_USER', 'admin', `Administrator rejected account for user ID ${userId}.`);
  };

  const updateUserRole = (userId: string, newRole: UserRole, designatedHouses?: string[]) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { 
          ...u, 
          role: newRole, 
          designatedHouses: designatedHouses || u.designatedHouses 
        };
      }
      return u;
    }));
    logAction('UPDATE_USER_ROLE', 'admin', `Updated role to ${newRole} for user ID ${userId}.`);
  };

  const updateUserStatus = (userId: string, newStatus: UserStatus) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    logAction('UPDATE_USER_STATUS', 'admin', `Updated status to ${newStatus} for user ID ${userId}.`);
  };

  const assignUserHouses = (userId: string, houses: string[]) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, designatedHouses: houses } : u));
    logAction('ASSIGN_HOUSES', 'admin', `Updated house assignments to [${houses.join(', ')}] for user ID ${userId}.`);
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    logAction('DELETE_USER', 'admin', `Deleted user ID ${userId}.`);
  };

  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      logAction('SWITCH_USER', 'auth', `Switched active profile to ${user.fullName} [${user.role}].`);
    }
  };

  const switchUserRole = (role: UserRole) => {
    // Look for existing user with role or update currentUser role
    const matched = users.find(u => u.role === role);
    if (matched) {
      setCurrentUser(matched);
    } else if (currentUser) {
      const updated = { ...currentUser, role };
      setCurrentUser(updated);
    }
  };

  // Farm Profile Methods
  const updateFarmProfile = (profile: Partial<FarmProfile>) => {
    setFarmProfile(prev => ({ ...prev, ...profile }));
    logAction('UPDATE_FARM_PROFILE', 'admin', `Updated farm profile information (${profile.name || 'details'}).`);
  };

  const updateStandardVaccination = (program: StandardMedProgramItem[]) => {
    setFarmProfile(prev => ({ ...prev, standardVaccinationProgram: program }));
    logAction('UPDATE_STANDARD_VACCINATION', 'admin', `Updated standard vaccination schedule (${program.length} items).`);
  };

  const updateStandardFeedGuide = (guide: StandardFeedGuideItem[]) => {
    setFarmProfile(prev => ({ ...prev, standardFeedGuide: guide }));
    logAction('UPDATE_STANDARD_FEED_GUIDE', 'admin', `Updated standard feed guide (${guide.length} items).`);
  };

  const updateStandardHenday = (henday: StandardHendayItem[]) => {
    setFarmProfile(prev => ({ ...prev, standardHenday: henday }));
    logAction('UPDATE_STANDARD_HENDAY', 'admin', `Updated standard Henday% production curve.`);
  };

  const updateStandardBodyWeights = (weights: StandardBodyWeightItem[]) => {
    setFarmProfile(prev => ({ ...prev, standardBodyWeights: weights }));
    logAction('UPDATE_STANDARD_BODY_WEIGHTS', 'admin', `Updated standard body weight curves.`);
  };

  const updateStandardEggWeights = (eggWeights: StandardEggWeightItem[]) => {
    setFarmProfile(prev => ({ ...prev, standardEggWeights: eggWeights }));
    logAction('UPDATE_STANDARD_EGG_WEIGHTS', 'admin', `Updated standard egg weight progression.`);
  };

  // Flock Methods & Depletion Calculations
  const getFlockStats = (houseNumber: string, referenceDate?: string): FlockStats | null => {
    const flock = flocks.find(f => f.houseNumber === houseNumber);
    if (!flock) return null;

    // Dynamically calculate flock age from loading date (prefers female loading date, falls back to male or hatch date)
    const effectiveLoadingDate = flock.loadingDateFemale || flock.loadingDateMale || flock.hatchDate;
    const ageCalc = calculateFlockAgeFromLoadingDate(effectiveLoadingDate, referenceDate);
    const ageWeeks = ageCalc.ageWeeks;

    const houseDepletions = depletions.filter(d => d.houseNumber === houseNumber);
    const totalMaleDepleted = houseDepletions.reduce((sum, d) => sum + d.maleCount, 0);
    const totalFemaleDepleted = houseDepletions.reduce((sum, d) => sum + d.femaleCount, 0);
    const totalDepleted = totalMaleDepleted + totalFemaleDepleted;

    const initialTotal = flock.initialMales + flock.initialFemales;
    const currentMales = Math.max(0, flock.currentMales);
    const currentFemales = Math.max(0, flock.currentFemales);
    const totalCurrent = currentMales + currentFemales;

    const livabilityPct = initialTotal > 0 ? (totalCurrent / initialTotal) * 100 : 100;
    
    let maleToFemaleRatioStr = '0 : 0';
    if (currentMales > 0 && currentFemales > 0) {
      maleToFemaleRatioStr = `1 : ${(currentFemales / currentMales).toFixed(1)}`;
    } else if (currentMales > 0 && currentFemales === 0) {
      maleToFemaleRatioStr = `${currentMales.toLocaleString()} M (1 : 0)`;
    } else if (currentMales === 0 && currentFemales > 0) {
      maleToFemaleRatioStr = `0 M : ${currentFemales.toLocaleString()} F`;
    } else {
      maleToFemaleRatioStr = '0 : 0';
    }

    const maleRatioPct = totalCurrent > 0 ? (currentMales / totalCurrent) * 100 : 0;

    return {
      flock,
      ageWeeks,
      ageDays: ageCalc.ageDays,
      totalDaysFromLoading: ageCalc.totalDaysFromLoading,
      weekAndDayStr: ageCalc.weekAndDayStr,
      currentMales,
      currentFemales,
      totalCurrent,
      initialTotal,
      livabilityPct: Math.round(livabilityPct * 10) / 10,
      maleToFemaleRatioStr,
      maleRatioPct: Math.round(maleRatioPct * 10) / 10,
      totalMaleDepleted,
      totalFemaleDepleted,
      totalDepleted
    };
  };

  const addFlock = (flockData: Omit<Flock, 'id' | 'currentMales' | 'currentFemales'>) => {
    const newFlock: Flock = {
      ...flockData,
      id: 'flock_' + Date.now(),
      currentMales: flockData.initialMales,
      currentFemales: flockData.initialFemales,
      pens: flockData.pens || [
        { id: 'pen_l1', name: 'Pen L1', side: 'Left', males: Math.floor(flockData.initialMales / 4), females: Math.floor(flockData.initialFemales / 4) },
        { id: 'pen_l2', name: 'Pen L2', side: 'Left', males: Math.floor(flockData.initialMales / 4), females: Math.floor(flockData.initialFemales / 4) },
        { id: 'pen_r1', name: 'Pen R1', side: 'Right', males: Math.floor(flockData.initialMales / 4), females: Math.floor(flockData.initialFemales / 4) },
        { id: 'pen_r2', name: 'Pen R2', side: 'Right', males: Math.floor(flockData.initialMales / 4), females: Math.floor(flockData.initialFemales / 4) }
      ]
    };
    setFlocks(prev => [...prev, newFlock]);
    logAction('ADD_FLOCK', 'flock', `Added flock in ${newFlock.houseNumber} (${newFlock.breed}, ${newFlock.initialMales}M / ${newFlock.initialFemales}F).`, newFlock.houseNumber);
  };

  const updateFlock = (id: string, updates: Partial<Flock>) => {
    setFlocks(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    logAction('UPDATE_FLOCK', 'flock', `Updated flock parameters for ID ${id}.`);
  };

  const deleteFlock = (id: string) => {
    const target = flocks.find(f => f.id === id);
    setFlocks(prev => prev.filter(f => f.id !== id));
    logAction('DELETE_FLOCK', 'flock', `Deleted flock in ${target?.houseNumber || id}.`, target?.houseNumber);
  };

  // Inter-House Bird Transfers (Males & Females)
  const addTransfer = (transfer: Omit<BirdTransferRecord, 'id' | 'createdAt' | 'loggedBy'>): { success: boolean; message: string } => {
    const { sourceHouse, destHouse, maleCount, femaleCount, sourceSide, sourcePenName, destSide, destPenName, reason, date } = transfer;

    if (sourceHouse === destHouse) {
      return { success: false, message: 'Source and destination houses cannot be the same.' };
    }

    if (maleCount <= 0 && femaleCount <= 0) {
      return { success: false, message: 'Please specify at least 1 male or female bird to transfer.' };
    }

    const sourceFlock = flocks.find(f => f.houseNumber === sourceHouse);
    const destFlock = flocks.find(f => f.houseNumber === destHouse);

    if (!sourceFlock || !destFlock) {
      return { success: false, message: 'Selected source or destination house could not be found.' };
    }

    if (sourceFlock.currentMales < maleCount) {
      return { 
        success: false, 
        message: `Insufficient males in ${sourceHouse}: requested ${maleCount}, but only ${sourceFlock.currentMales} available.` 
      };
    }

    if (sourceFlock.currentFemales < femaleCount) {
      return { 
        success: false, 
        message: `Insufficient females in ${sourceHouse}: requested ${femaleCount}, but only ${sourceFlock.currentFemales} available.` 
      };
    }

    // Apply bird population adjustments
    setFlocks(prev => prev.map(f => {
      if (f.houseNumber === sourceHouse) {
        const updatedPens = f.pens?.map(p => {
          if (sourcePenName && p.name === sourcePenName) {
            return {
              ...p,
              males: Math.max(0, p.males - maleCount),
              females: Math.max(0, p.females - femaleCount)
            };
          }
          return p;
        });

        return {
          ...f,
          currentMales: Math.max(0, f.currentMales - maleCount),
          currentFemales: Math.max(0, f.currentFemales - femaleCount),
          pens: updatedPens || f.pens
        };
      }

      if (f.houseNumber === destHouse) {
        const updatedPens = f.pens?.map(p => {
          if (destPenName && p.name === destPenName) {
            return {
              ...p,
              males: p.males + maleCount,
              females: p.females + femaleCount
            };
          }
          return p;
        });

        return {
          ...f,
          currentMales: f.currentMales + maleCount,
          currentFemales: f.currentFemales + femaleCount,
          pens: updatedPens || f.pens
        };
      }

      return f;
    }));

    const newTransfer: BirdTransferRecord = {
      ...transfer,
      id: 'tr_' + Date.now(),
      loggedBy: currentUser?.fullName || 'Staff',
      createdAt: new Date().toISOString()
    };

    setTransfers(prev => [newTransfer, ...prev]);

    logAction(
      'LOG_TRANSFER',
      'flock',
      `Transferred ${maleCount} males & ${femaleCount} females from ${sourceHouse} to ${destHouse}${reason ? ` (${reason})` : ''}.`,
      sourceHouse
    );

    return {
      success: true,
      message: `Successfully transferred ${maleCount > 0 ? `${maleCount} males ` : ''}${femaleCount > 0 ? `${femaleCount} females ` : ''}from ${sourceHouse} to ${destHouse}!`
    };
  };

  const deleteTransfer = (id: string, revertCounts: boolean = true) => {
    const target = transfers.find(t => t.id === id);
    if (!target) return;

    if (revertCounts) {
      setFlocks(prev => prev.map(f => {
        if (f.houseNumber === target.sourceHouse) {
          return {
            ...f,
            currentMales: f.currentMales + target.maleCount,
            currentFemales: f.currentFemales + target.femaleCount
          };
        }
        if (f.houseNumber === target.destHouse) {
          return {
            ...f,
            currentMales: Math.max(0, f.currentMales - target.maleCount),
            currentFemales: Math.max(0, f.currentFemales - target.femaleCount)
          };
        }
        return f;
      }));
    }

    setTransfers(prev => prev.filter(t => t.id !== id));
    logAction('DELETE_TRANSFER', 'flock', `Deleted transfer record ${target.sourceHouse} -> ${target.destHouse} (${target.maleCount}M, ${target.femaleCount}F).`);
  };

  // Feed Inventory Methods
  const addFeedStock = (entry: Omit<FeedStockEntry, 'id' | 'totalKg' | 'createdAt'>) => {
    const kgPerBag = entry.kgPerBag || 50;
    const totalKg = entry.bags * kgPerBag;
    const newEntry: FeedStockEntry = {
      ...entry,
      id: 'fs_' + Date.now(),
      kgPerBag,
      totalKg,
      createdAt: new Date().toISOString()
    };
    setFeedStockEntries(prev => [newEntry, ...prev]);
    logAction('ADD_FEED_STOCK', 'feed', `Received ${entry.bags} bags (${totalKg} kg) of ${entry.feedType}.`);
  };

  const deleteFeedStock = (id: string) => {
    setFeedStockEntries(prev => prev.filter(e => e.id !== id));
    logAction('DELETE_FEED_STOCK', 'feed', `Deleted feed stock entry ID ${id}.`);
  };

  const addFeedConsumption = (record: Omit<FeedConsumptionRecord, 'id' | 'createdAt' | 'loggedBy'>) => {
    // If female and male quantities are provided, calculate total quantity and default feedType
    const femaleKg = record.femaleQuantityKg ?? 0;
    const maleKg = record.maleQuantityKg ?? 0;
    const totalKg = (record.femaleQuantityKg !== undefined || record.maleQuantityKg !== undefined)
      ? (femaleKg + maleKg)
      : record.quantityKg;

    const primaryFeedType = record.feedType || record.femaleFeedType || record.maleFeedType || 'BLC 1';

    const newRecord: FeedConsumptionRecord = {
      ...record,
      feedType: primaryFeedType,
      quantityKg: totalKg,
      id: 'fc_' + Date.now(),
      loggedBy: currentUser?.fullName || 'Staff',
      createdAt: new Date().toISOString()
    };
    setFeedConsumptionRecords(prev => [newRecord, ...prev]);

    const descParts = [];
    if (record.femaleQuantityKg) descParts.push(`Females: ${record.femaleQuantityKg}kg (${record.femaleFeedType || primaryFeedType})`);
    if (record.maleQuantityKg) descParts.push(`Males: ${record.maleQuantityKg}kg (${record.maleFeedType || primaryFeedType})`);
    const desc = descParts.length > 0 ? descParts.join(', ') : `${totalKg}kg of ${primaryFeedType}`;

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    logAction(
      'LOG_FEED_CONSUMPTION', 
      'feed', 
      `Logged feed in ${record.houseNumber} [Total ${totalKg} kg] - ${desc}${isOffline ? ' (Stored Offline in IndexedDB)' : ''}.`, 
      record.houseNumber
    );

    if (isOffline) {
      enqueueOfflineAction(
        'feed',
        'LOG_FEED_CONSUMPTION',
        newRecord,
        currentUser?.fullName || 'Staff',
        record.houseNumber
      ).then(() => {
        getOfflineQueueFromIndexedDB().then(setOfflineQueue);
      });
    }
  };

  const deleteFeedConsumption = (id: string) => {
    setFeedConsumptionRecords(prev => prev.filter(r => r.id !== id));
    logAction('DELETE_FEED_CONSUMPTION', 'feed', `Deleted feed consumption record ID ${id}.`);
  };

  const ALL_FEED_TYPES: FeedType[] = ['CSC 1', 'CSC 2', 'CGC', 'PDC', 'BLC 1', 'BLC 2', 'BLC 3', 'BMCC', 'BMCR', 'CBB'];

  const getFeedStockSummary = (): FeedStockSummaryItem[] => {
    return ALL_FEED_TYPES.map(ft => {
      const totalReceivedKg = feedStockEntries
        .filter(e => e.feedType === ft)
        .reduce((sum, e) => sum + e.totalKg, 0);
      const totalReceivedBags = feedStockEntries
        .filter(e => e.feedType === ft)
        .reduce((sum, e) => sum + e.bags, 0);

      const totalConsumedKg = feedConsumptionRecords
        .reduce((sum, r) => {
          let recTotal = 0;
          if (r.femaleFeedType !== undefined || r.maleFeedType !== undefined) {
            if (r.femaleFeedType === ft) recTotal += (r.femaleQuantityKg || 0);
            if (r.maleFeedType === ft) recTotal += (r.maleQuantityKg || 0);
          } else {
            // Legacy record without male/female breakdown
            if (r.feedType === ft) recTotal += (r.quantityKg || 0);
          }
          return sum + recTotal;
        }, 0);

      const currentStockKg = Math.max(0, totalReceivedKg - totalConsumedKg);
      const currentStockBags = Math.round((currentStockKg / 50) * 10) / 10;
      const isLowStock = currentStockBags <= 4; // <= 4 bags trigger per prompt requirement!

      return {
        feedType: ft,
        totalReceivedKg,
        totalReceivedBags,
        totalConsumedKg,
        currentStockKg,
        currentStockBags,
        isLowStock
      };
    });
  };

  const getLowStockAlerts = () => {
    return getFeedStockSummary().filter(s => s.isLowStock);
  };

  // Depletions & Mortality Methods
  const addDepletion = (record: Omit<DepletionRecord, 'id' | 'createdAt' | 'loggedBy'>) => {
    const newRecord: DepletionRecord = {
      ...record,
      id: 'dep_' + Date.now(),
      loggedBy: currentUser?.fullName || 'Staff',
      createdAt: new Date().toISOString()
    };
    setDepletions(prev => [newRecord, ...prev]);

    setFlocks(prev => prev.map(f => {
      if (f.houseNumber === record.houseNumber) {
        return {
          ...f,
          currentMales: Math.max(0, f.currentMales - record.maleCount),
          currentFemales: Math.max(0, f.currentFemales - record.femaleCount)
        };
      }
      return f;
    }));

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    logAction(
      'LOG_DEPLETION', 
      'mortality', 
      `Depletion (${record.category}): ${record.maleCount}M, ${record.femaleCount}F in ${record.houseNumber} (${record.side} side)${isOffline ? ' (Stored Offline in IndexedDB)' : ''}.`, 
      record.houseNumber
    );

    if (isOffline) {
      enqueueOfflineAction(
        'mortality',
        'LOG_DEPLETION',
        newRecord,
        currentUser?.fullName || 'Staff',
        record.houseNumber
      ).then(() => {
        getOfflineQueueFromIndexedDB().then(setOfflineQueue);
      });
    }
  };

  const deleteDepletion = (id: string) => {
    setDepletions(prev => prev.filter(d => d.id !== id));
    logAction('DELETE_DEPLETION', 'mortality', `Deleted depletion record ID ${id}.`);
  };

  // Medicine & Vaccines Methods
  const addMedProduct = (product: Omit<MedProduct, 'id'>) => {
    const newProduct: MedProduct = {
      ...product,
      id: 'med_' + Date.now(),
      currentStockUnits: product.currentStockUnits || product.currentStock || 0,
      currentStock: product.currentStockUnits || product.currentStock || 0
    };
    setMedProducts(prev => [...prev, newProduct]);
    logAction('ADD_MED_PRODUCT', 'medicine', `Registered new health product: ${product.name} (${product.type}).`);
  };

  const updateMedProduct = (id: string, updates: Partial<MedProduct>) => {
    setMedProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    logAction('UPDATE_MED_PRODUCT', 'medicine', `Updated medicine product details for ID ${id}.`);
  };

  const deleteMedProduct = (id: string) => {
    const target = medProducts.find(p => p.id === id);
    setMedProducts(prev => prev.filter(p => p.id !== id));
    logAction('DELETE_MED_PRODUCT', 'medicine', `Deleted product ${target?.name || id}.`);
  };

  const addMedStock = (productId: string, unitsAdded: number, date: string, lotNumber?: string, notes?: string) => {
    const product = medProducts.find(p => p.id === productId);
    if (!product) return;

    const newLog: MedStockLog = {
      id: 'msl_' + Date.now(),
      productId,
      productName: product.name,
      date,
      unitsAdded,
      lotNumber,
      notes,
      createdAt: new Date().toISOString()
    };
    setMedStockLogs(prev => [newLog, ...prev]);

    setMedProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const nextUnits = p.currentStockUnits + unitsAdded;
        return { ...p, currentStockUnits: nextUnits, currentStock: nextUnits };
      }
      return p;
    }));

    logAction('ADD_MED_STOCK', 'medicine', `Added ${unitsAdded} units of ${product.name}.`);
  };

  const addMedAdministration = (record: Omit<MedAdministrationRecord, 'id' | 'createdAt' | 'loggedBy'>) => {
    const newRecord: MedAdministrationRecord = {
      ...record,
      id: 'ma_' + Date.now(),
      loggedBy: currentUser?.fullName || 'Staff',
      createdAt: new Date().toISOString()
    };
    setMedAdministrations(prev => [newRecord, ...prev]);

    setMedProducts(prev => prev.map(p => {
      if (p.id === record.productId) {
        const remaining = Math.max(0, p.currentStockUnits - record.unitsUsed);
        return { ...p, currentStockUnits: remaining, currentStock: remaining };
      }
      return p;
    }));

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    logAction(
      'LOG_MED_ADMINISTRATION', 
      'medicine', 
      `Administered ${record.unitsUsed} units of ${record.productName} in ${record.houseNumber} via ${record.method}${isOffline ? ' (Stored Offline in IndexedDB)' : ''}.`, 
      record.houseNumber
    );

    if (isOffline) {
      enqueueOfflineAction(
        'medicine',
        'LOG_MED_ADMINISTRATION',
        newRecord,
        currentUser?.fullName || 'Staff',
        record.houseNumber
      ).then(() => {
        getOfflineQueueFromIndexedDB().then(setOfflineQueue);
      });
    }
  };

  const deleteMedAdministration = (id: string) => {
    setMedAdministrations(prev => prev.filter(a => a.id !== id));
    logAction('DELETE_MED_ADMINISTRATION', 'medicine', `Deleted medication administration record ID ${id}.`);
  };

  const getUpcomingVaccines = (): VaccineAlert[] => {
    const alerts: VaccineAlert[] = [];
    flocks.forEach(flock => {
      const stats = getFlockStats(flock.houseNumber);
      if (!stats) return;
      const currentWeek = stats.ageWeeks;

      farmProfile.standardVaccinationProgram.forEach(item => {
        if (Math.abs(item.ageWeek - currentWeek) <= 1) {
          alerts.push({
            id: `${flock.houseNumber}_${item.id}`,
            houseNumber: flock.houseNumber,
            flockAgeWeeks: currentWeek,
            scheduledWeek: item.ageWeek,
            productName: item.productName,
            diseaseTarget: item.diseaseTarget,
            method: item.method,
            urgency: item.ageWeek === currentWeek ? 'due_now' : 'upcoming'
          });
        }
      });
    });
    return alerts;
  };

  const getUpcomingVaccineAlerts = getUpcomingVaccines;

  // Body Weight Methods
  const addBodyWeightRecord = (record: Omit<BodyWeightRecord, 'id' | 'createdAt' | 'loggedBy'>) => {
    const prevRecord = bodyWeights
      .filter(b => b.houseNumber === record.houseNumber && b.week < record.week)
      .sort((a, b) => b.week - a.week)[0];

    const weeklyGainMale = prevRecord ? record.maleAvgWeightGrams - prevRecord.maleAvgWeightGrams : undefined;
    const weeklyGainFemale = prevRecord ? record.femaleAvgWeightGrams - prevRecord.femaleAvgWeightGrams : undefined;

    const newRecord: BodyWeightRecord = {
      ...record,
      id: 'bw_' + Date.now(),
      weeklyGainMale: record.weeklyGainMale ?? weeklyGainMale,
      weeklyGainFemale: record.weeklyGainFemale ?? weeklyGainFemale,
      loggedBy: currentUser?.fullName || 'Staff',
      createdAt: new Date().toISOString()
    };
    setBodyWeights(prev => [newRecord, ...prev]);

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    logAction(
      'LOG_BODY_WEIGHT', 
      'bodyweight', 
      `Logged Week ${record.week} weight in ${record.houseNumber} (M: ${record.maleAvgWeightGrams}g, F: ${record.femaleAvgWeightGrams}g)${isOffline ? ' (Stored Offline in IndexedDB)' : ''}.`, 
      record.houseNumber
    );

    if (isOffline) {
      enqueueOfflineAction(
        'flock',
        'LOG_BODY_WEIGHT',
        newRecord,
        currentUser?.fullName || 'Staff',
        record.houseNumber
      ).then(() => {
        getOfflineQueueFromIndexedDB().then(setOfflineQueue);
      });
    }
  };

  const deleteBodyWeightRecord = (id: string) => {
    setBodyWeights(prev => prev.filter(b => b.id !== id));
    logAction('DELETE_BODY_WEIGHT', 'bodyweight', `Deleted body weight record ID ${id}.`);
  };

  // Egg Production normalized records
  const eggProductionRecords: NormalizedEggProductionRecord[] = rawEggRecords.map(rec => {
    const fStat = getFlockStats(rec.houseNumber);
    const femalePop = rec.femalePopulationAtDate || fStat?.currentFemales || 9500;

    let totalHE = rec.totalHE;
    if (totalHE === undefined) {
      if (rec.sorting?.hatchingEggs?.total !== undefined) {
        totalHE = rec.sorting.hatchingEggs.total;
      } else {
        totalHE = (rec.heNest || 0) + (rec.heFloor || 0);
      }
    }

    let totalNHE = rec.totalNHE;
    if (totalNHE === undefined) {
      if (rec.sorting?.nonHatchingEggs?.total !== undefined) {
        totalNHE = rec.sorting.nonHatchingEggs.total;
      } else {
        totalNHE = (rec.small || 0) + 
          (rec.thinShell || 0) + 
          (rec.misshape || 0) + 
          (rec.doubleYolk || 0) + 
          (rec.broken || 0) + 
          (rec.spoiled || 0) + 
          (rec.others || 0);
      }
    }

    const totalEggs = rec.tep || rec.totalEggs || (totalHE + totalNHE);
    const hatchingEggPct = totalEggs > 0 ? (totalHE / totalEggs) * 100 : 0;
    const nonHatchingEggPct = totalEggs > 0 ? (totalNHE / totalEggs) * 100 : 0;
    const hendayPct = femalePop > 0 ? (totalEggs / femalePop) * 100 : 0;

    return {
      ...rec,
      totalEggs,
      totalHatchingEggs: totalHE,
      totalNonHatchingEggs: totalNHE,
      hatchingEggPct,
      nonHatchingEggPct,
      hendayPct,
      femalePopulationAtDate: femalePop,
      sampleEggWeightGrams: rec.sampleEggWeightGrams || 58.4,
      sorting: rec.sorting || {
        hatchingEggs: {
          total: totalHE,
          heNest: rec.heNest ?? totalHE,
          heFloor: rec.heFloor ?? 0
        },
        nonHatchingEggs: {
          total: totalNHE,
          dirty: rec.spoiled || Math.round(totalNHE * 0.35),
          cracked: rec.thinShell || Math.round(totalNHE * 0.25),
          broken: rec.broken || Math.round(totalNHE * 0.15),
          abnormal: rec.misshape || Math.round(totalNHE * 0.10),
          doubleYolk: rec.doubleYolk || Math.round(totalNHE * 0.10),
          softShelled: Math.round(totalNHE * 0.05),
          misshapen: rec.misshape || 0,
          leakers: 0
        }
      },
      collections: rec.collections || [
        { id: 'c1', collectionNumber: 1, collectionTime: '08:00 AM', leftSideCount: Math.round(totalEggs * 0.2), rightSideCount: Math.round(totalEggs * 0.2), totalCount: Math.round(totalEggs * 0.4) },
        { id: 'c2', collectionNumber: 2, collectionTime: '11:30 AM', leftSideCount: Math.round(totalEggs * 0.2), rightSideCount: Math.round(totalEggs * 0.2), totalCount: Math.round(totalEggs * 0.4) },
        { id: 'c3', collectionNumber: 3, collectionTime: '03:30 PM', leftSideCount: Math.round(totalEggs * 0.1), rightSideCount: Math.round(totalEggs * 0.1), totalCount: Math.round(totalEggs * 0.2) }
      ]
    };
  });

  const addEggProductionRecord = (record: Partial<EggProductionRecord> & { houseNumber: string; date: string }) => {
    const fStat = getFlockStats(record.houseNumber);
    const femalePop = record.femalePopulationAtDate || fStat?.currentFemales || 9500;

    let he = (record.heNest || 0) + (record.heFloor || 0);
    if (record.sorting?.hatchingEggs?.total) he = record.sorting.hatchingEggs.total;

    let nhe = (record.small || 0) + (record.thinShell || 0) + (record.misshape || 0) + (record.doubleYolk || 0) + (record.broken || 0) + (record.spoiled || 0) + (record.others || 0);
    if (record.sorting?.nonHatchingEggs?.total) nhe = record.sorting.nonHatchingEggs.total;

    const tep = he + nhe;

    const newRecord: EggProductionRecord = {
      ...record,
      id: 'ep_' + Date.now(),
      heNest: record.heNest ?? he,
      heFloor: record.heFloor ?? 0,
      totalHE: he,
      totalNHE: nhe,
      tep,
      femalePopulationAtDate: femalePop,
      sampleEggWeightGrams: record.sampleEggWeightGrams || 58.4,
      loggedBy: currentUser?.fullName || 'Staff',
      createdAt: new Date().toISOString()
    };

    setRawEggRecords(prev => [newRecord, ...prev]);

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    logAction(
      'LOG_EGG_PRODUCTION', 
      'egg_prod', 
      `Recorded Egg Production in ${record.houseNumber} on ${record.date} (TEP: ${tep}, HE: ${he}, NHE: ${nhe})${isOffline ? ' (Stored Offline in IndexedDB)' : ''}.`, 
      record.houseNumber
    );

    if (isOffline) {
      enqueueOfflineAction(
        'egg_production',
        'CREATE_EGG_RECORD',
        newRecord,
        currentUser?.fullName || 'Staff',
        record.houseNumber
      ).then(() => {
        getOfflineQueueFromIndexedDB().then(setOfflineQueue);
      });
    }

    // Asynchronously sync to MongoDB if backend is connected
    if (!isOffline) {
      fetch('/api/egg-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      }).catch(err => {
        console.warn('Could not sync egg record to MongoDB endpoint:', err);
      });
    }
  };

  const deleteEggProductionRecord = (id: string) => {
    setRawEggRecords(prev => prev.filter(r => r.id !== id));
    logAction('DELETE_EGG_PRODUCTION', 'egg_prod', `Deleted egg production record ID ${id}.`);

    fetch(`/api/egg-records/${id}`, {
      method: 'DELETE'
    }).catch(err => {
      console.warn('Could not sync delete to MongoDB endpoint:', err);
    });
  };

  const addWeeklyEggWeight = (record: Omit<WeeklyEggWeightRecord, 'id' | 'createdAt' | 'loggedBy'>) => {
    const newRecord: WeeklyEggWeightRecord = {
      ...record,
      id: 'wew_' + Date.now(),
      loggedBy: currentUser?.fullName || 'Staff',
      createdAt: new Date().toISOString()
    };
    setWeeklyEggWeights(prev => [newRecord, ...prev]);
    logAction('LOG_EGG_WEIGHT', 'egg_prod', `Recorded weekly egg weight for ${record.houseNumber}: ${record.weightGrams}g at Prod Wk ${record.ageInProductionWeeks}.`, record.houseNumber);
  };

  const deleteWeeklyEggWeight = (id: string) => {
    setWeeklyEggWeights(prev => prev.filter(w => w.id !== id));
    logAction('DELETE_EGG_WEIGHT', 'egg_prod', `Deleted weekly egg weight record ID ${id}.`);
  };

  // Biosecurity Compliance Operations
  const addBiosecurityRequirement = (req: Omit<BiosecurityRequirement, 'id' | 'createdAt'>) => {
    const newReq: BiosecurityRequirement = {
      ...req,
      id: 'bio_req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdBy: currentUser?.fullName || 'Farm Manager',
      createdAt: new Date().toISOString()
    };
    setBiosecurityRequirements(prev => [newReq, ...prev]);
    logAction('ADD_BIOSECURITY_REQ', 'biosecurity', `Added biosecurity protocol: "${req.title}" (${req.category}, ${req.criticalLevel}).`);
  };

  const updateBiosecurityRequirement = (id: string, updates: Partial<BiosecurityRequirement>) => {
    setBiosecurityRequirements(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    logAction('UPDATE_BIOSECURITY_REQ', 'biosecurity', `Updated biosecurity protocol ID ${id}.`);
  };

  const deleteBiosecurityRequirement = (id: string) => {
    const target = biosecurityRequirements.find(r => r.id === id);
    setBiosecurityRequirements(prev => prev.filter(r => r.id !== id));
    logAction('DELETE_BIOSECURITY_REQ', 'biosecurity', `Deleted biosecurity protocol: "${target?.title || id}".`);
  };

  const toggleBiosecurityRequirementActive = (id: string) => {
    setBiosecurityRequirements(prev => prev.map(r => {
      if (r.id === id) {
        const nextActive = !r.active;
        logAction('TOGGLE_BIOSECURITY_REQ', 'biosecurity', `${nextActive ? 'Activated' : 'Deactivated'} biosecurity protocol: "${r.title}".`);
        return { ...r, active: nextActive };
      }
      return r;
    }));
  };

  const calculateAndUpdateDailySummary = (date: string, updatedLogs: BiosecurityVerificationLog[], currentRequirements: BiosecurityRequirement[]) => {
    const activeReqs = currentRequirements.filter(r => r.active);
    const dayLogs = updatedLogs.filter(l => l.date === date);
    const verifiedLogs = dayLogs.filter(l => l.verified);
    const passedLogs = dayLogs.filter(l => l.status === 'pass' && l.verified);
    const failedLogs = dayLogs.filter(l => l.status === 'fail' && l.verified);
    const naLogs = dayLogs.filter(l => l.status === 'na' && l.verified);

    const totalActive = activeReqs.length;
    const applicableTotal = Math.max(1, totalActive - naLogs.length);
    const complianceScorePct = totalActive === 0 ? 100 : Math.round((passedLogs.length / applicableTotal) * 100);

    setBiosecuritySummaries(prev => ({
      ...prev,
      [date]: {
        date,
        totalRequirements: totalActive,
        verifiedCount: verifiedLogs.length,
        passedCount: passedLogs.length,
        failedCount: failedLogs.length,
        complianceScorePct: Math.min(100, complianceScorePct),
        supervisorSignoff: prev[date]?.supervisorSignoff || false,
        supervisorSignoffBy: prev[date]?.supervisorSignoffBy,
        supervisorSignoffAt: prev[date]?.supervisorSignoffAt,
        supervisorNotes: prev[date]?.supervisorNotes
      }
    }));
  };

  const toggleBiosecurityLog = (
    requirementId: string, 
    date: string, 
    status?: BiosecurityStatus, 
    notes?: string, 
    correctiveAction?: string
  ) => {
    const req = biosecurityRequirements.find(r => r.id === requirementId);
    if (!req) return;

    let newLogs: BiosecurityVerificationLog[] = [];
    const existingIndex = biosecurityLogs.findIndex(l => l.requirementId === requirementId && l.date === date);

    if (existingIndex >= 0) {
      const existing = biosecurityLogs[existingIndex];
      let nextStatus: BiosecurityStatus = status || (existing.status === 'pass' ? 'fail' : existing.status === 'fail' ? 'na' : 'pass');

      const updatedLog: BiosecurityVerificationLog = {
        ...existing,
        status: nextStatus,
        verified: true,
        verifiedBy: currentUser?.id || 'staff',
        verifiedByName: currentUser?.fullName || 'Staff',
        verifiedAt: new Date().toISOString(),
        notes: notes !== undefined ? notes : existing.notes,
        correctiveAction: correctiveAction !== undefined ? correctiveAction : existing.correctiveAction
      };

      newLogs = [...biosecurityLogs];
      newLogs[existingIndex] = updatedLog;
    } else {
      const targetStatus: BiosecurityStatus = status || 'pass';
      const newLogEntry: BiosecurityVerificationLog = {
        id: 'blog_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        date,
        requirementId,
        requirementTitle: req.title,
        category: req.category,
        targetArea: req.targetArea,
        status: targetStatus,
        verified: true,
        verifiedBy: currentUser?.id || 'staff',
        verifiedByName: currentUser?.fullName || 'Staff',
        verifiedAt: new Date().toISOString(),
        notes,
        correctiveAction
      };
      newLogs = [newLogEntry, ...biosecurityLogs];
    }

    setBiosecurityLogs(newLogs);
    calculateAndUpdateDailySummary(date, newLogs, biosecurityRequirements);

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    logAction(
      'BIOSECURITY_VERIFICATION', 
      'biosecurity', 
      `Verified biosecurity item: "${req.title}" as [${(status || 'pass').toUpperCase()}] for date ${date}${isOffline ? ' (Stored Offline in IndexedDB)' : ''}.`
    );

    if (isOffline) {
      enqueueOfflineAction(
        'biosecurity',
        'VERIFY_BIOSECURITY',
        { requirementId, date, status: status || 'pass', notes, correctiveAction },
        currentUser?.fullName || 'Staff'
      ).then(() => {
        getOfflineQueueFromIndexedDB().then(setOfflineQueue);
      });
    }
  };

  const batchVerifyAllBiosecurity = (date: string, status: BiosecurityStatus = 'pass') => {
    const activeReqs = biosecurityRequirements.filter(r => r.active);
    const existingOtherLogs = biosecurityLogs.filter(l => l.date !== date);
    
    const nowIso = new Date().toISOString();
    const batchLogs: BiosecurityVerificationLog[] = activeReqs.map(req => {
      const prev = biosecurityLogs.find(l => l.date === date && l.requirementId === req.id);
      return {
        id: prev?.id || ('blog_' + Date.now() + '_' + req.id),
        date,
        requirementId: req.id,
        requirementTitle: req.title,
        category: req.category,
        targetArea: req.targetArea,
        status,
        verified: true,
        verifiedBy: currentUser?.id || 'staff',
        verifiedByName: currentUser?.fullName || 'Staff',
        verifiedAt: nowIso,
        notes: prev?.notes || 'Batch verified compliant'
      };
    });

    const newLogs = [...batchLogs, ...existingOtherLogs];
    setBiosecurityLogs(newLogs);
    calculateAndUpdateDailySummary(date, newLogs, biosecurityRequirements);
    logAction('BIOSECURITY_BATCH_VERIFY', 'biosecurity', `Batch-verified all ${activeReqs.length} active biosecurity requirements as [${status.toUpperCase()}] for date ${date}.`);
  };

  const signoffBiosecurityDaily = (date: string, supervisorNotes?: string) => {
    const activeReqs = biosecurityRequirements.filter(r => r.active);
    const dayLogs = biosecurityLogs.filter(l => l.date === date && l.verified);
    const passed = dayLogs.filter(l => l.status === 'pass').length;
    const failed = dayLogs.filter(l => l.status === 'fail').length;
    const score = activeReqs.length === 0 ? 100 : Math.round((passed / activeReqs.length) * 100);

    const updatedSummary: BiosecurityDailySummary = {
      date,
      totalRequirements: activeReqs.length,
      verifiedCount: dayLogs.length,
      passedCount: passed,
      failedCount: failed,
      complianceScorePct: score,
      supervisorSignoff: true,
      supervisorSignoffBy: currentUser?.fullName || 'Farm Manager',
      supervisorSignoffAt: new Date().toISOString(),
      supervisorNotes: supervisorNotes || 'Daily biosecurity protocols audited and verified compliant.'
    };

    setBiosecuritySummaries(prev => ({
      ...prev,
      [date]: updatedSummary
    }));

    logAction('BIOSECURITY_SUPERVISOR_SIGNOFF', 'biosecurity', `Manager supervisor sign-off approved for ${date} with ${score}% compliance score.`);
  };

  const getBiosecurityDailyStats = (date: string) => {
    const activeReqs = biosecurityRequirements.filter(r => r.active);
    const dayLogs = biosecurityLogs.filter(l => l.date === date);
    const verified = dayLogs.filter(l => l.verified);
    const passed = dayLogs.filter(l => l.status === 'pass' && l.verified);
    const failed = dayLogs.filter(l => l.status === 'fail' && l.verified);
    const naCount = dayLogs.filter(l => l.status === 'na' && l.verified).length;
    const summary = biosecuritySummaries[date];

    const applicableTotal = Math.max(1, activeReqs.length - naCount);
    const compliancePct = activeReqs.length === 0 ? 100 : Math.min(100, Math.round((passed.length / applicableTotal) * 100));

    return {
      total: activeReqs.length,
      verified: verified.length,
      passed: passed.length,
      failed: failed.length,
      naCount,
      compliancePct,
      isSignedOff: Boolean(summary?.supervisorSignoff),
      signedOffBy: summary?.supervisorSignoffBy,
      signedOffAt: summary?.supervisorSignoffAt,
      supervisorNotes: summary?.supervisorNotes
    };
  };

  // Reset & Backup Data
  const resetAllDataToDefaults = () => {
    setFarmProfile(INITIAL_FARM_PROFILE);
    setUsers(INITIAL_USERS);
    setFlocks(INITIAL_FLOCKS);
    setFeedStockEntries(INITIAL_FEED_STOCK);
    setFeedConsumptionRecords(INITIAL_FEED_CONSUMPTION);
    setDepletions(INITIAL_DEPLETIONS);
    setTransfers(INITIAL_BIRD_TRANSFERS);
    setMedProducts(INITIAL_MED_PRODUCTS);
    setMedAdministrations(INITIAL_MED_ADMIN);
    setBodyWeights(INITIAL_BODY_WEIGHTS);
    setRawEggRecords(INITIAL_EGG_PRODUCTION);
    setWeeklyEggWeights(INITIAL_WEEKLY_EGG_WEIGHTS);
    setSystemLogs(INITIAL_SYSTEM_LOGS);
    setBiosecurityRequirements(INITIAL_BIOSECURITY_REQUIREMENTS);
    setBiosecurityLogs(INITIAL_BIOSECURITY_LOGS);
    setBiosecuritySummaries(INITIAL_BIOSECURITY_SUMMARIES);
    setCurrentUser(INITIAL_USERS[0]);
    localStorage.clear();
    logAction('SYSTEM_RESET', 'admin', 'Reset all farm management database to factory demo defaults.');
  };

  const clearDatabaseForNewCycle = async (): Promise<{ success: boolean; message: string }> => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Reset all houses 1-6 to baseline zero for a brand new placement cycle
    const freshFlocks: Flock[] = [1, 2, 3, 4, 5, 6].map(num => ({
      id: `flock_h${num}_new`,
      houseNumber: `House ${num}`,
      breed: 'Cobb 500',
      loadingDateMale: todayStr,
      loadingDateFemale: todayStr,
      initialMales: 0,
      initialFemales: 0,
      currentMales: 0,
      currentFemales: 0,
      hatchDate: todayStr,
      status: 'active' as const,
      notes: `House ${num} ready for new flock placement cycle.`,
      pens: [
        { id: `pen_h${num}_l1`, name: 'Pen L1', side: 'Left' as const, males: 0, females: 0 },
        { id: `pen_h${num}_l2`, name: 'Pen L2', side: 'Left' as const, males: 0, females: 0 },
        { id: `pen_h${num}_r1`, name: 'Pen R1', side: 'Right' as const, males: 0, females: 0 },
        { id: `pen_h${num}_r2`, name: 'Pen R2', side: 'Right' as const, males: 0, females: 0 },
      ]
    }));

    setFlocks(freshFlocks);
    setRawEggRecords([]);
    setWeeklyEggWeights([]);
    setFeedStockEntries([]);
    setFeedConsumptionRecords([]);
    setDepletions([]);
    setTransfers([]);
    setMedAdministrations([]);
    setBodyWeights([]);

    const newLog: SystemLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'usr_admin',
      userName: currentUser?.fullName || 'System Administrator',
      userRole: currentUser?.role || 'admin',
      action: 'CYCLE_CLEARED',
      category: 'admin',
      details: 'All flock production, egg collections, feed logs, and mortality history cleared to start a fresh cycle.',
    };
    setSystemLogs(prev => [newLog, ...prev.slice(0, 150)]);

    // 2. Wipe database on backend / MongoDB if connected
    let backendMsg = '';
    try {
      const resp = await fetch('/api/db/clear-all', { method: 'POST' });
      if (resp.ok) {
        const json = await resp.json();
        backendMsg = json.message || 'Cloud database wiped successfully.';
      }
    } catch {
      backendMsg = 'Local state wiped (offline mode).';
    }

    await checkDBStatus();

    return {
      success: true,
      message: `Database successfully cleared for new cycle. ${backendMsg}`
    };
  };

  const exportDataJson = (): string => {
    const payload = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      farmProfile,
      users,
      flocks,
      feedStockEntries,
      feedConsumptionRecords,
      depletions,
      transfers,
      medProducts,
      medAdministrations,
      bodyWeights,
      eggProductionRecords: rawEggRecords,
      weeklyEggWeights,
      systemLogs,
      biosecurityRequirements,
      biosecurityLogs,
      biosecuritySummaries
    };
    return JSON.stringify(payload, null, 2);
  };

  const importDataJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.farmProfile) setFarmProfile(data.farmProfile);
      if (data.users) setUsers(data.users);
      if (data.flocks) setFlocks(data.flocks);
      if (data.feedStockEntries) setFeedStockEntries(data.feedStockEntries);
      if (data.feedConsumptionRecords) setFeedConsumptionRecords(data.feedConsumptionRecords);
      if (data.depletions) setDepletions(data.depletions);
      if (data.transfers) setTransfers(data.transfers);
      if (data.medProducts) setMedProducts(data.medProducts);
      if (data.medAdministrations) setMedAdministrations(data.medAdministrations);
      if (data.bodyWeights) setBodyWeights(data.bodyWeights);
      if (data.eggProductionRecords) setRawEggRecords(data.eggProductionRecords);
      if (data.weeklyEggWeights) setWeeklyEggWeights(data.weeklyEggWeights);
      if (data.systemLogs) setSystemLogs(data.systemLogs);
      if (data.biosecurityRequirements) setBiosecurityRequirements(data.biosecurityRequirements);
      if (data.biosecurityLogs) setBiosecurityLogs(data.biosecurityLogs);
      if (data.biosecuritySummaries) setBiosecuritySummaries(data.biosecuritySummaries);
      logAction('IMPORT_DATA', 'admin', 'Successfully imported backup database from external JSON file.');
      return true;
    } catch {
      return false;
    }
  };

  // Role Permissions Matrix
  const r = currentUser?.role || 'Egg Collector';
  const isAdmin = r === 'admin' || r === 'System Administrator';
  const isManager = r === 'farm_manager' || r === 'Farm Manager';
  const isFlockman = r === 'flockman' || r === 'Flockman';
  const isLeadman = r === 'leadman' || r === 'Leadman';
  const isCollector = r === 'egg_collector' || r === 'Egg Collector';

  const permissions: PermissionCheck = {
    canViewModule: (moduleId: string): boolean => {
      if (isAdmin || isManager) return true;

      if (isFlockman) {
        // Flockman: access designated flock's record Egg Production, view Flockman's Module, view Flock, Farm Profile and Reports
        return ['dashboard', 'egg_production', 'flockman', 'flockman_module', 'flock', 'flock_list', 'farm_profile', 'reports'].includes(moduleId);
      }
      if (isLeadman) {
        // Leadman: access designated flock's record Egg Production, record Flockman's Module, view Flock, Farm Profile, mortality and Reports
        return ['dashboard', 'egg_production', 'flockman', 'flockman_module', 'flock', 'flock_list', 'farm_profile', 'mortality', 'reports'].includes(moduleId);
      }
      if (isCollector) {
        // Egg Collector: access designated flock, Record Egg Production and Reports
        return ['dashboard', 'egg_production', 'reports'].includes(moduleId);
      }
      return false;
    },

    canEditRecord: isAdmin,
    canDeleteRecord: isAdmin,
    canApproveUsers: isAdmin,
    canManageUsers: isAdmin,
    canManageFarmProfile: isAdmin,
    canManageMedicines: isAdmin || isManager,
    canManageBiosecurityRequirements: isAdmin || isManager,
    canVerifyBiosecurity: true,
    
    canRecordEggProduction: (houseNumber?: string) => {
      if (isAdmin || isManager) return true;
      if (!houseNumber) return true;
      return (currentUser?.designatedHouses || []).includes(houseNumber);
    },

    canRecordFlockmanModule: (houseNumber?: string) => {
      if (isAdmin || isManager || isLeadman) {
        if (!houseNumber || isAdmin || isManager) return true;
        return (currentUser?.designatedHouses || []).includes(houseNumber);
      }
      return false;
    },

    canRecordMortality: (houseNumber?: string) => {
      if (isAdmin || isManager || isLeadman) {
        if (!houseNumber || isAdmin || isManager) return true;
        return (currentUser?.designatedHouses || []).includes(houseNumber);
      }
      return false;
    },

    canAddFeedStock: isAdmin || isManager,
    canAddMedicine: isAdmin || isManager,
    canAddFlock: isAdmin || isManager
  };

  return (
    <FarmContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        registerUser,
        recoverAccount,
        approveUser,
        rejectUser,
        updateUserRole,
        updateUserStatus,
        assignUserHouses,
        deleteUser,
        switchUser,
        switchUserRole,

        farmProfile,
        updateFarmProfile,
        updateStandardVaccination,
        updateStandardFeedGuide,
        updateStandardHenday,
        updateStandardBodyWeights,
        updateStandardEggWeights,

        flocks,
        addFlock,
        updateFlock,
        deleteFlock,
        getFlockStats,
        transfers,
        addTransfer,
        deleteTransfer,

        feedStockEntries,
        feedConsumptionRecords,
        addFeedStock,
        deleteFeedStock,
        addFeedConsumption,
        deleteFeedConsumption,
        getFeedStockSummary,
        getLowStockAlerts,

        depletions,
        addDepletion,
        deleteDepletion,

        medProducts,
        medStockLogs,
        medAdministrations,
        addMedProduct,
        updateMedProduct,
        deleteMedProduct,
        addMedStock,
        addMedAdministration,
        deleteMedAdministration,
        getUpcomingVaccines,
        getUpcomingVaccineAlerts,

        bodyWeights,
        addBodyWeightRecord,
        deleteBodyWeightRecord,

        eggProductionRecords,
        weeklyEggWeights,
        addEggProductionRecord,
        deleteEggProductionRecord,
        addWeeklyEggWeight,
        deleteWeeklyEggWeight,

        biosecurityRequirements,
        biosecurityLogs,
        biosecuritySummaries,
        addBiosecurityRequirement,
        updateBiosecurityRequirement,
        deleteBiosecurityRequirement,
        toggleBiosecurityRequirementActive,
        toggleBiosecurityLog,
        batchVerifyAllBiosecurity,
        signoffBiosecurityDaily,
        getBiosecurityDailyStats,

        systemLogs,
        auditLogs: systemLogs,
        logAction,
        resetAllDataToDefaults,
        clearDatabaseForNewCycle,
        exportDataJson,
        importDataJson,

        dbStatus,
        isMobileDevice,
        databaseEngine,
        checkDBStatus,
        reconnectDB,
        syncAllToMongoDB,
        pullAllFromMongoDB,

        // Offline & IndexedDB Caching Engine
        isOnline,
        offlineQueue,
        pendingOfflineCount: offlineQueue.length,
        storageQuota,
        refreshStorageQuota,
        syncOfflineQueue,
        clearOfflineSyncQueue,
        lastIndexedDBSync,

        permissions
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = (): FarmContextType => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
