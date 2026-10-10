import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import {
  UserAccount,
  UserRole,
  UserStatus,
  FarmProfile,
  Flock,
  FeedStockEntry,
  FeedConsumptionRecord,
  DepletionRecord,
  BirdTransferRecord,
  MedProduct,
  MedStockLog,
  MedAdministrationRecord,
  BodyWeightRecord,
  EggProductionRecord,
  WeeklyEggWeightRecord,
  SystemLog,
  StandardMedProgramItem,
  StandardFeedGuideItem,
  StandardHendayItem,
  StandardBodyWeightItem,
  StandardEggWeightItem,
  BiosecurityRequirement,
  BiosecurityVerificationLog,
  BiosecurityDailySummary,
  BiosecurityStatus,
  DeliveryRecord,
  HatchingSummaryRecord,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_FARM_PROFILE,
  INITIAL_BIOSECURITY_REQUIREMENTS,
} from '../data/initialData';
import { PasswordStrengthResult } from '../utils/security';
import { detectPlatform } from '../utils/platform';
import {
  getMongoDBStatus,
  pullAllDataFromMongoDB,
  syncAllDataToMongoDB,
  saveDocToMongoDB,
  deleteDocFromMongoDB,
  startMongoDBPolling,
  purgeOldDataFromMongoDB,
  clearAllLocalCacheAndStorage,
} from '../services/mongodbSync';
import {
  FlockStats,
  NormalizedEggProductionRecord,
  FeedStockSummaryItem,
  VaccineAlert,
  BiosecurityDailyMetrics,
} from '../utils/farmCalculations';
import {
  deduplicateById,
  areArraysEqualByIdAndUpdated,
  deduplicateFlocks,
  deduplicateUsers,
} from '../domain/collectionUtils';
import { PermissionCheck, buildRolePermissions } from '../domain/permissionsPolicy';
import { useAuthDomain } from '../hooks/domains/useAuthDomain';
import { useFarmProfileDomain } from '../hooks/domains/useFarmProfileDomain';
import { useFlockDomain } from '../hooks/domains/useFlockDomain';
import { useEggAndHatcheryDomain } from '../hooks/domains/useEggAndHatcheryDomain';
import { useFeedHealthBiosecurityDomain } from '../hooks/domains/useFeedHealthBiosecurityDomain';

export type {
  FlockStats,
  NormalizedEggProductionRecord,
  FeedStockSummaryItem,
  VaccineAlert,
  BiosecurityDailyMetrics,
  PermissionCheck,
};

export { deduplicateById, deduplicateFlocks, deduplicateUsers };

export interface StorageQuotaInfo {
  usageMB: number;
  quotaMB: number;
  percentUsed: number;
  itemCounts: {
    flocks: number;
    eggRecords: number;
    feedRecords: number;
    mortalityRecords: number;
    medRecords: number;
    biosecurityLogs: number;
  };
}

interface FarmContextType {
  // User & Auth State
  currentUser: UserAccount | null;
  users: UserAccount[];
  login: (
    identifier: string,
    password?: string
  ) => Promise<{
    success: boolean;
    message: string;
    user?: UserAccount;
    lockedOut?: boolean;
    remainingMinutes?: number;
    lockedRemainingSeconds?: number;
  }>;
  logout: () => void;
  registerUser: (
    userData: Omit<UserAccount, 'id' | 'createdAt' | 'status'> & { password?: string },
    autoActivate?: boolean
  ) => Promise<{ success: boolean; message: string; user?: UserAccount }>;
  recoverAccount: (
    identifier: string,
    securityAnswer: string,
    newPassword: string
  ) => Promise<{ success: boolean; message: string }>;
  changePassword: (
    firstArg: string,
    secondArg: string,
    thirdArg?: string,
    fourthArg?: string,
    fifthArg?: string
  ) => Promise<{ success: boolean; message: string }>;
  adminResetUserPassword: (
    userId: string,
    customPassword?: string
  ) => Promise<{ success: boolean; message: string; tempPassword?: string }>;
  adminToggleUserLock: (
    userId: string,
    forceLockState?: boolean
  ) => { success: boolean; message: string };
  evaluatePasswordStrength: (password: string) => PasswordStrengthResult;
  approveUser: (userId: string, assignedRole?: UserRole, assignedHouses?: string[]) => void;
  rejectUser: (userId: string) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  updateUserStatus: (userId: string, newStatus: UserStatus) => void;
  updateUser: (
    userId: string,
    updates: Partial<UserAccount> & { newPassword?: string }
  ) => Promise<{ success: boolean; message: string; user?: UserAccount }>;
  addUser: (
    userData: Omit<UserAccount, 'id' | 'createdAt' | 'status'> & {
      password?: string;
      status?: UserStatus;
    }
  ) => Promise<{ success: boolean; message: string; user?: UserAccount }>;
  assignUserHouses: (userId: string, houses: string[]) => void;
  deleteUser: (userId: string) => void;
  switchUser: (userId: string) => void;
  switchUserRole: (role: UserRole) => void;

  // Farm Profile & Standards
  farmProfile: FarmProfile;
  updateFarmProfile: (
    profile: Partial<FarmProfile>
  ) => Promise<{ success: boolean; message: string; data?: FarmProfile }>;
  updateAllStandards: (standards: {
    vaccine?: StandardMedProgramItem[];
    feed?: StandardFeedGuideItem[];
    henday?: StandardHendayItem[];
    bodyweight?: StandardBodyWeightItem[];
    eggweight?: StandardEggWeightItem[];
  }) => Promise<{ success: boolean; message: string }>;
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
  addTransfer: (
    transfer: Omit<BirdTransferRecord, 'id' | 'createdAt' | 'loggedBy'>
  ) => { success: boolean; message: string };
  deleteTransfer: (id: string, revertCounts?: boolean) => void;

  // Feed Inventory
  feedStockEntries: FeedStockEntry[];
  feedConsumptionRecords: FeedConsumptionRecord[];
  addFeedStock: (entry: Omit<FeedStockEntry, 'id' | 'totalKg' | 'createdAt'>) => void;
  deleteFeedStock: (id: string) => void;
  addFeedConsumption: (
    record: Omit<FeedConsumptionRecord, 'id' | 'createdAt' | 'loggedBy'>
  ) => void;
  deleteFeedConsumption: (id: string) => void;
  getFeedStockSummary: () => FeedStockSummaryItem[];
  getLowStockAlerts: () => FeedStockSummaryItem[];

  // Depletions (Mortality & Culls)
  depletions: DepletionRecord[];
  addDepletion: (record: Omit<DepletionRecord, 'id' | 'createdAt' | 'loggedBy'>) => void;
  deleteDepletion: (id: string) => void;

  // Medicine & Vaccines
  medProducts: MedProduct[];
  medStockLogs: MedStockLog[];
  medAdministrations: MedAdministrationRecord[];
  addMedProduct: (product: Omit<MedProduct, 'id'>) => void;
  addMedProductsBatch: (products: Omit<MedProduct, 'id'>[], mergeExisting?: boolean) => void;
  updateMedProduct: (id: string, updates: Partial<MedProduct>) => void;
  deleteMedProduct: (id: string) => void;
  addMedStock: (
    productId: string,
    unitsAdded: number,
    date: string,
    lotNumber?: string,
    notes?: string
  ) => void;
  addMedAdministration: (
    record: Omit<MedAdministrationRecord, 'id' | 'createdAt' | 'loggedBy'>
  ) => void;
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
  addEggProductionRecord: (
    record: Partial<EggProductionRecord> & { houseNumber: string; date: string }
  ) => void;
  updateEggProductionRecord: (id: string, updates: Partial<EggProductionRecord>) => void;
  deleteEggProductionRecord: (id: string) => void;
  addWeeklyEggWeight: (
    record: Omit<WeeklyEggWeightRecord, 'id' | 'createdAt' | 'loggedBy'>
  ) => void;
  deleteWeeklyEggWeight: (id: string) => void;

  // Deliveries (ESRRR)
  deliveries: DeliveryRecord[];
  addDelivery: (record: Omit<DeliveryRecord, 'id' | 'createdAt'>) => DeliveryRecord;
  updateDelivery: (id: string, updates: Partial<DeliveryRecord>) => void;
  deleteDelivery: (id: string) => void;
  getDeliveryById: (id: string) => DeliveryRecord | undefined;

  // Hatching Summaries
  hatchingSummaries: HatchingSummaryRecord[];
  addHatchingSummary: (
    record: Omit<HatchingSummaryRecord, 'id' | 'createdAt'>
  ) => HatchingSummaryRecord;
  updateHatchingSummary: (id: string, updates: Partial<HatchingSummaryRecord>) => void;
  deleteHatchingSummary: (id: string) => void;
  getHatchingSummaryById: (id: string) => HatchingSummaryRecord | undefined;

  // Biosecurity Compliance
  biosecurityRequirements: BiosecurityRequirement[];
  biosecurityLogs: BiosecurityVerificationLog[];
  biosecuritySummaries: Record<string, BiosecurityDailySummary>;
  addBiosecurityRequirement: (req: Omit<BiosecurityRequirement, 'id' | 'createdAt'>) => void;
  updateBiosecurityRequirement: (id: string, updates: Partial<BiosecurityRequirement>) => void;
  deleteBiosecurityRequirement: (id: string) => void;
  toggleBiosecurityRequirementActive: (id: string) => void;
  toggleBiosecurityLog: (
    requirementId: string,
    date: string,
    status?: BiosecurityStatus,
    notes?: string,
    correctiveAction?: string
  ) => void;
  batchVerifyAllBiosecurity: (date: string, status?: BiosecurityStatus) => void;
  signoffBiosecurityDaily: (date: string, supervisorNotes?: string) => void;
  getBiosecurityDailyStats: (date: string) => BiosecurityDailyMetrics;

  // System Logs & Data Management
  systemLogs: SystemLog[];
  auditLogs: SystemLog[];
  logAction: (
    action: string,
    category: SystemLog['category'],
    details: string,
    houseNumber?: string
  ) => void;
  resetAllDataToDefaults: () => void;
  clearDatabaseForNewCycle: () => Promise<{ success: boolean; message: string }>;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;

  // Database & Platform Engine
  dbStatus: {
    connected: boolean;
    state: string;
    dbName: string | null;
    hasUriConfigured: boolean;
  };
  isMobileDevice: boolean;
  databaseEngine: 'mongodb';
  checkDBStatus: () => Promise<void>;
  reconnectDB: (uri?: string) => Promise<{ success: boolean; message: string }>;

  // MongoDB Cloud Database Engine
  mongoStatus: {
    connected: boolean;
    dbName: string;
    projectId?: string;
    lastSyncedAt: string | null;
    isSyncing: boolean;
    uriConfigured?: boolean;
    serverInfo?: string;
    error?: string | null;
  };
  syncAllToMongoDB: () => Promise<{ success: boolean; message: string; counts?: any }>;
  pullAllFromMongoDB: (forcePull?: boolean) => Promise<{ success: boolean; message: string }>;
  purgeDatabaseAndCache: (options?: {
    collections?: string[];
    preserveUsers?: boolean;
    preserveStandards?: boolean;
    preserveFarmProfile?: boolean;
    clearCache?: boolean;
    purgeDatabase?: boolean;
  }) => Promise<{ success: boolean; message: string; deletedCounts?: Record<string, number> }>;

  // Compatibility aliases
  firestoreStatus: {
    connected: boolean;
    projectId: string;
    dbName?: string;
    lastSyncedAt: string | null;
    isSyncing: boolean;
  };
  syncAllToFirestore: () => Promise<{ success: boolean; message: string }>;
  pullAllFromFirestore: (forcePull?: boolean) => Promise<{ success: boolean; message: string }>;

  // Storage Sync Engine
  storageQuota: StorageQuotaInfo;
  refreshStorageQuota: () => Promise<void>;

  // Permission Helpers
  permissions: PermissionCheck;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('broiler_breeder_active_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.username) {
          return parsed;
        }
      } catch {
        // ignore
      }
    }
    return null;
  });

  const [users, setUsers] = useState<UserAccount[]>(() => INITIAL_USERS);
  const [farmProfile, setFarmProfile] = useState<FarmProfile>(INITIAL_FARM_PROFILE);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [feedStockEntries, setFeedStockEntries] = useState<FeedStockEntry[]>([]);
  const [feedConsumptionRecords, setFeedConsumptionRecords] = useState<FeedConsumptionRecord[]>([]);
  const [depletions, setDepletions] = useState<DepletionRecord[]>([]);
  const [transfers, setTransfers] = useState<BirdTransferRecord[]>([]);
  const [medProducts, setMedProducts] = useState<MedProduct[]>([]);
  const [medStockLogs, setMedStockLogs] = useState<MedStockLog[]>([]);
  const [medAdministrations, setMedAdministrations] = useState<MedAdministrationRecord[]>([]);
  const [bodyWeights, setBodyWeights] = useState<BodyWeightRecord[]>([]);
  const [rawEggRecords, setRawEggRecords] = useState<EggProductionRecord[]>([]);
  const [weeklyEggWeights, setWeeklyEggWeights] = useState<WeeklyEggWeightRecord[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [biosecurityRequirements, setBiosecurityRequirements] = useState<BiosecurityRequirement[]>(
    () => INITIAL_BIOSECURITY_REQUIREMENTS
  );
  const [biosecurityLogs, setBiosecurityLogs] = useState<BiosecurityVerificationLog[]>([]);
  const [biosecuritySummaries, setBiosecuritySummaries] = useState<
    Record<string, BiosecurityDailySummary>
  >({});
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [hatchingSummaries, setHatchingSummaries] = useState<HatchingSummaryRecord[]>([]);

  const platformInfo = useMemo(() => detectPlatform(), []);

  const isMobileDevice = useMemo(() => {
    return (
      platformInfo.isMobile ||
      platformInfo.isTablet ||
      (typeof navigator !== 'undefined' &&
        /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)) ||
      (typeof window !== 'undefined' && window.innerWidth <= 768)
    );
  }, [platformInfo]);

  const databaseEngine = 'mongodb' as const;

  const [mongoStatus, setMongoStatus] = useState<{
    connected: boolean;
    dbName: string;
    projectId?: string;
    lastSyncedAt: string | null;
    isSyncing: boolean;
    uriConfigured?: boolean;
    serverInfo?: string;
    error?: string | null;
  }>({
    connected: true,
    dbName: 'farmflowproviii',
    projectId: 'farmflowproviii',
    lastSyncedAt: new Date().toISOString(),
    isSyncing: false,
    uriConfigured: true,
    serverInfo: 'MongoDB Production Cluster Active & Ready',
  });

  const firestoreStatus = useMemo(
    () => ({
      connected: mongoStatus.connected,
      projectId: mongoStatus.dbName,
      dbName: mongoStatus.dbName,
      lastSyncedAt: mongoStatus.lastSyncedAt,
      isSyncing: mongoStatus.isSyncing,
    }),
    [mongoStatus.connected, mongoStatus.dbName, mongoStatus.lastSyncedAt, mongoStatus.isSyncing]
  );

  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    state: string;
    dbName: string | null;
    hasUriConfigured: boolean;
  }>({
    connected: true,
    state: 'MongoDB Atlas Production Database Active',
    dbName: 'farmflowproviii',
    hasUriConfigured: true,
  });

  const [storageQuota, setStorageQuota] = useState<StorageQuotaInfo>({
    usageMB: 0,
    quotaMB: 512,
    percentUsed: 0,
    itemCounts: {
      flocks: 0,
      eggRecords: 0,
      feedRecords: 0,
      mortalityRecords: 0,
      medRecords: 0,
      biosecurityLogs: 0,
    },
  });

  const pendingWritesRef = useRef<number>(0);
  const mutationEpochRef = useRef<number>(0);

  const collectionCountsRef = useRef({
    flocks: 0,
    eggRecords: 0,
    feedRecords: 0,
    mortalityRecords: 0,
    medRecords: 0,
    biosecurityLogs: 0,
    totalRecords: 0,
  });

  useEffect(() => {
    const totalRecords =
      flocks.length +
      rawEggRecords.length +
      feedConsumptionRecords.length +
      depletions.length +
      medAdministrations.length +
      biosecurityLogs.length +
      users.length +
      deliveries.length +
      hatchingSummaries.length;

    collectionCountsRef.current = {
      flocks: flocks.length,
      eggRecords: rawEggRecords.length,
      feedRecords: feedConsumptionRecords.length,
      mortalityRecords: depletions.length,
      medRecords: medAdministrations.length,
      biosecurityLogs: biosecurityLogs.length,
      totalRecords,
    };

    const approxBytes = totalRecords * 350;
    const usageMB = Number((approxBytes / (1024 * 1024)).toFixed(2));
    const quotaMB = 512;
    const percentUsed = Math.min(100, Number(((usageMB / quotaMB) * 100).toFixed(1)));

    setStorageQuota({
      usageMB,
      quotaMB,
      percentUsed,
      itemCounts: {
        flocks: flocks.length,
        eggRecords: rawEggRecords.length,
        feedRecords: feedConsumptionRecords.length,
        mortalityRecords: depletions.length,
        medRecords: medAdministrations.length,
        biosecurityLogs: biosecurityLogs.length,
      },
    });
  }, [
    flocks.length,
    rawEggRecords.length,
    feedConsumptionRecords.length,
    depletions.length,
    medAdministrations.length,
    biosecurityLogs.length,
    users.length,
    deliveries.length,
    hatchingSummaries.length,
  ]);

  // Persistence Adapter Helpers
  const saveDocToFirestore = useCallback((collectionName: string, docId: string, data: any) => {
    pendingWritesRef.current += 1;
    mutationEpochRef.current += 1;
    saveDocToMongoDB(collectionName, docId, data)
      .then(ok => {
        if (ok) {
          setMongoStatus(prev => ({
            ...prev,
            lastSyncedAt: new Date().toISOString(),
            connected: true,
          }));
        }
      })
      .finally(() => {
        pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
      });
  }, []);

  const deleteDocFromFirestore = useCallback((collectionName: string, docId: string) => {
    pendingWritesRef.current += 1;
    mutationEpochRef.current += 1;
    deleteDocFromMongoDB(collectionName, docId)
      .then(ok => {
        if (ok) {
          setMongoStatus(prev => ({
            ...prev,
            lastSyncedAt: new Date().toISOString(),
            connected: true,
          }));
        }
      })
      .finally(() => {
        pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
      });
  }, []);

  const syncUserToBackend = useCallback(
    (user: UserAccount) => {
      saveDocToFirestore('users', user.id, user);
    },
    [saveDocToFirestore]
  );

  // System Audit Logger
  const logAction = useCallback(
    (
      action: string,
      category: SystemLog['category'],
      details: string,
      houseNumber?: string
    ) => {
      const newLog: SystemLog = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'system',
        userName: currentUser?.fullName || 'System',
        userRole: currentUser?.role || 'admin',
        action,
        category,
        details,
        houseNumber,
      };
      setSystemLogs(prev => [newLog, ...prev.slice(0, 150)]);
      saveDocToFirestore('auditLogs', newLog.id, newLog);
    },
    [currentUser?.id, currentUser?.fullName, currentUser?.role, saveDocToFirestore]
  );

  const refreshStorageQuota = useCallback(async () => {
    try {
      const status = await getMongoDBStatus();
      setMongoStatus(prev => ({
        ...prev,
        connected: status.connected,
        dbName: status.dbName || 'farmflowproviii',
        lastSyncedAt: status.lastSyncedAt || prev.lastSyncedAt,
        error: status.error || null,
        serverInfo: status.serverInfo || prev.serverInfo,
      }));

      const counts = collectionCountsRef.current;
      const approxBytes = counts.totalRecords * 350;
      const usageMB = Number((approxBytes / (1024 * 1024)).toFixed(2));
      const quotaMB = 512;
      const percentUsed = Math.min(100, Number(((usageMB / quotaMB) * 100).toFixed(1)));

      setStorageQuota({
        usageMB,
        quotaMB,
        percentUsed,
        itemCounts: {
          flocks: counts.flocks,
          eggRecords: counts.eggRecords,
          feedRecords: counts.feedRecords,
          mortalityRecords: counts.mortalityRecords,
          medRecords: counts.medRecords,
          biosecurityLogs: counts.biosecurityLogs,
        },
      });

      setDbStatus({
        connected: status.connected,
        state: status.connected
          ? 'MongoDB Atlas Active & Synchronized'
          : 'MongoDB Offline / Reconnecting',
        dbName: status.dbName || 'farmflowproviii',
        hasUriConfigured: status.uriConfigured,
      });
    } catch {
      // quiet fallback
    }
  }, []);

  const checkDBStatus = useCallback(async () => {
    await refreshStorageQuota();
  }, [refreshStorageQuota]);

  const pullAllFromMongoDB = useCallback(
    async (forcePull: boolean = false): Promise<{ success: boolean; message: string }> => {
      const pullStartEpoch = mutationEpochRef.current;
      if (forcePull) {
        setMongoStatus(prev => (prev.isSyncing ? prev : { ...prev, isSyncing: true }));
      }
      try {
        const res = await pullAllDataFromMongoDB();
        if (
          !forcePull &&
          (pendingWritesRef.current > 0 || mutationEpochRef.current !== pullStartEpoch)
        ) {
          if (forcePull) {
            setMongoStatus(prev => (prev.isSyncing ? { ...prev, isSyncing: false } : prev));
          }
          return {
            success: true,
            message: 'Skipped applying stale poll snapshot due to active local mutation.',
          };
        }

        if (res.success && res.data) {
          const d = res.data;
          if (Array.isArray(d.users) && d.users.length > 0) {
            setUsers(prev => {
              const next = deduplicateUsers([...prev, ...d.users]);
              return areArraysEqualByIdAndUpdated(prev, next) ? prev : next;
            });
          }
          if (d.farmProfile && typeof d.farmProfile === 'object') {
            setFarmProfile(prev => {
              const merged = { ...prev, ...d.farmProfile };
              if (d.standards) {
                const stds = d.standards;
                if (
                  Array.isArray(stds.vaccination?.items) &&
                  stds.vaccination.items.length > 0
                ) {
                  merged.standardVaccinationProgram = stds.vaccination.items;
                }
                if (Array.isArray(stds.feedGuide?.items) && stds.feedGuide.items.length > 0) {
                  merged.standardFeedGuide = stds.feedGuide.items;
                }
                if (
                  Array.isArray(stds.bodyWeights?.items) &&
                  stds.bodyWeights.items.length > 0
                ) {
                  merged.standardBodyWeights = stds.bodyWeights.items;
                }
                if (Array.isArray(stds.henday?.items) && stds.henday.items.length > 0) {
                  merged.standardHenday = stds.henday.items;
                }
                if (
                  Array.isArray(stds.eggWeights?.items) &&
                  stds.eggWeights.items.length > 0
                ) {
                  merged.standardEggWeights = stds.eggWeights.items;
                }
              }
              return JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged;
            });
          }
          if (Array.isArray(d.flocks)) {
            setFlocks(prev => {
              const next = deduplicateFlocks(d.flocks);
              return areArraysEqualByIdAndUpdated(prev, next) ? prev : next;
            });
          }
          if (Array.isArray(d.eggRecords)) {
            setRawEggRecords(prev => {
              const next = deduplicateById(d.eggRecords);
              return areArraysEqualByIdAndUpdated(prev, next) ? prev : next;
            });
          }
          if (Array.isArray(d.feedStock)) {
            setFeedStockEntries(prev => {
              const next = deduplicateById(d.feedStock);
              return areArraysEqualByIdAndUpdated(prev, next) ? prev : next;
            });
          }
          if (Array.isArray(d.feedRecords)) {
            setFeedConsumptionRecords(prev => {
              const next = deduplicateById(d.feedRecords);
              return areArraysEqualByIdAndUpdated(prev, next) ? prev : next;
            });
          }
          if (Array.isArray(d.depletions)) {
            setDepletions(prev => {
              const next = deduplicateById(d.depletions);
              return areArraysEqualByIdAndUpdated(prev, next) ? prev : next;
            });
          }
          if (Array.isArray(d.transfers)) {
            setTransfers(prev => {
              const next = deduplicateById(d.transfers);
              return areArraysEqualByIdAndUpdated(prev, next) ? prev : next;
            });
          }
          if (Array.isArray(d.medProducts)) {
            setMedProducts(prev => {
              const next = deduplicateById(d.medProducts);
              return areArraysEqualByIdAndUpdated(prev, next) ? prev : next;
            });
          }
          if (Array.isArray(d.medStockLogs)) {
            setMedStockLogs(prev => {
              const next = deduplicateById(d.medStockLogs);
              return areArraysEqualByIdAndUpdated(prev, next) ? prev : next;
            });
          }
          if (Array.isArray(d.medAdmins)) {
            setMedAdministrations(prev => {
              const next = deduplicateById(d.medAdmins);
              return areArraysEqualByIdAndUpdated(prev, next) ? prev : next;
            });
          }
          if (Array.isArray(d.bodyWeights)) {
            setBodyWeights(prev => {
              const next = deduplicateById(d.bodyWeights);
              return areArraysEqualByIdAndUpdated(prev, next) ? prev : next;
            });
          }
          if (Array.isArray(d.weeklyEggWeights)) {
            setWeeklyEggWeights(prev => {
              const next = deduplicateById(d.weeklyEggWeights);
              return areArraysEqualByIdAndUpdated(prev, next) ? prev : next;
            });
          }
          if (Array.isArray(d.biosecurityLogs)) {
            setBiosecurityLogs(prev => {
              const next = deduplicateById(d.biosecurityLogs);
              return areArraysEqualByIdAndUpdated(prev, next) ? prev : next;
            });
          }
          if (Array.isArray(d.biosecurityRequirements) && d.biosecurityRequirements.length > 0) {
            setBiosecurityRequirements(prev => {
              const next = deduplicateById(d.biosecurityRequirements);
              return areArraysEqualByIdAndUpdated(prev, next) ? prev : next;
            });
          }
          if (d.biosecuritySummaries && typeof d.biosecuritySummaries === 'object') {
            setBiosecuritySummaries(prev =>
              JSON.stringify(prev) === JSON.stringify(d.biosecuritySummaries)
                ? prev
                : d.biosecuritySummaries
            );
          }
          if (Array.isArray(d.deliveries)) {
            setDeliveries(prev => {
              const next = deduplicateById(d.deliveries);
              return areArraysEqualByIdAndUpdated(prev, next) ? prev : next;
            });
          }
          if (Array.isArray(d.hatchingSummaries)) {
            setHatchingSummaries(prev => {
              const next = deduplicateById(d.hatchingSummaries);
              return areArraysEqualByIdAndUpdated(prev, next) ? prev : next;
            });
          }
          if (Array.isArray(d.auditLogs)) {
            setSystemLogs(prev => {
              const next = deduplicateById<SystemLog>(d.auditLogs).slice(0, 100);
              return areArraysEqualByIdAndUpdated(prev, next) ? prev : next;
            });
          }

          if (forcePull) {
            setMongoStatus(prev => ({
              ...prev,
              connected: true,
              lastSyncedAt: new Date().toISOString(),
              isSyncing: false,
              error: null,
            }));
          } else {
            setMongoStatus(prev =>
              prev.connected && !prev.isSyncing && !prev.error
                ? prev
                : { ...prev, connected: true, isSyncing: false, error: null }
            );
          }
          return { success: true, message: 'Farm records loaded from MongoDB.' };
        }

        if (forcePull) {
          setMongoStatus(prev => (prev.isSyncing ? { ...prev, isSyncing: false } : prev));
        }
        return { success: false, message: 'No remote MongoDB records found' };
      } catch (err: any) {
        if (forcePull) {
          setMongoStatus(prev => (prev.isSyncing ? { ...prev, isSyncing: false } : prev));
        }
        return { success: false, message: err.message || 'Failed to pull from MongoDB' };
      }
    },
    []
  );

  const syncAllToMongoDB = useCallback(async (): Promise<{
    success: boolean;
    message: string;
    counts?: any;
  }> => {
    setMongoStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const payload = {
        users,
        farmProfile,
        flocks,
        eggRecords: rawEggRecords,
        feedStock: feedStockEntries,
        feedRecords: feedConsumptionRecords,
        depletions,
        transfers,
        medProducts,
        medStockLogs,
        medAdmins: medAdministrations,
        bodyWeights,
        weeklyEggWeights,
        biosecurityLogs,
        biosecurityRequirements,
        biosecuritySummaries,
        deliveries,
        hatchingSummaries,
        auditLogs: systemLogs,
      };

      const result = await syncAllDataToMongoDB(payload);
      setMongoStatus(prev => ({
        ...prev,
        connected: result.success,
        lastSyncedAt: new Date().toISOString(),
        isSyncing: false,
        error: result.success ? null : result.message,
      }));

      if (result.success) {
        logAction('MONGODB_SYNC', 'system', 'Synchronized all farm records to central MongoDB.');
      }
      return result;
    } catch (err: any) {
      setMongoStatus(prev => ({ ...prev, isSyncing: false, error: err.message }));
      return { success: false, message: err.message || 'Failed to sync with MongoDB' };
    }
  }, [
    users,
    farmProfile,
    flocks,
    rawEggRecords,
    feedStockEntries,
    feedConsumptionRecords,
    depletions,
    transfers,
    medProducts,
    medStockLogs,
    medAdministrations,
    bodyWeights,
    weeklyEggWeights,
    biosecurityLogs,
    biosecurityRequirements,
    biosecuritySummaries,
    deliveries,
    hatchingSummaries,
    systemLogs,
    logAction,
  ]);

  const reconnectDB = useCallback(
    async (_uri?: string): Promise<{ success: boolean; message: string }> => {
      try {
        const status = await getMongoDBStatus();
        await refreshStorageQuota();
        await pullAllFromMongoDB();
        if (status.connected) {
          return { success: true, message: 'MongoDB connection active and verified.' };
        }
        return { success: false, message: status.error || 'MongoDB connection offline.' };
      } catch (err: any) {
        return { success: false, message: err?.message || 'Failed to reconnect to database.' };
      }
    },
    [refreshStorageQuota, pullAllFromMongoDB]
  );

  const purgeDatabaseAndCache = useCallback(
    async (options?: {
      collections?: string[];
      preserveUsers?: boolean;
      preserveStandards?: boolean;
      preserveFarmProfile?: boolean;
      clearCache?: boolean;
      purgeDatabase?: boolean;
    }): Promise<{ success: boolean; message: string; deletedCounts?: Record<string, number> }> => {
      const {
        collections,
        preserveUsers = true,
        preserveStandards = true,
        preserveFarmProfile = true,
        clearCache = true,
        purgeDatabase = true,
      } = options || {};

      setMongoStatus(prev => ({ ...prev, isSyncing: true }));
      try {
        let deletedCounts: Record<string, number> = {};

        if (purgeDatabase) {
          const dbRes = await purgeOldDataFromMongoDB({
            collections,
            preserveUsers,
            preserveStandards,
            preserveFarmProfile,
          });
          if (dbRes.cleared) {
            deletedCounts = dbRes.cleared;
          }
        }

        if (clearCache) {
          await clearAllLocalCacheAndStorage();
        }

        setFlocks([]);
        setRawEggRecords([]);
        setWeeklyEggWeights([]);
        setDeliveries([]);
        setFeedStockEntries([]);
        setFeedConsumptionRecords([]);
        setDepletions([]);
        setTransfers([]);
        setMedProducts([]);
        setMedStockLogs([]);
        setMedAdministrations([]);
        setBodyWeights([]);
        setBiosecurityLogs([]);
        setHatchingSummaries([]);
        setBiosecuritySummaries({});

        if (!preserveFarmProfile) {
          setFarmProfile(INITIAL_FARM_PROFILE);
        }
        if (!preserveUsers) {
          setUsers(INITIAL_USERS);
        }

        setMongoStatus(prev => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: new Date().toISOString(),
        }));

        await refreshStorageQuota();

        return {
          success: true,
          message:
            'Persistent database records and local caches have been permanently purged.',
          deletedCounts,
        };
      } catch (err: any) {
        setMongoStatus(prev => ({ ...prev, isSyncing: false }));
        return {
          success: false,
          message: err?.message || 'Failed to purge database and cache.',
        };
      }
    },
    [refreshStorageQuota]
  );

  // Initial pull & Page Visibility-aware background polling
  useEffect(() => {
    refreshStorageQuota();
    pullAllFromMongoDB();

    const stopPolling = startMongoDBPolling(() => {
      pullAllFromMongoDB();
    }, 15000);

    return () => stopPolling();
  }, [refreshStorageQuota, pullAllFromMongoDB]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('broiler_breeder_active_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('broiler_breeder_active_user');
    }
  }, [currentUser]);

  // Compose Modular Clean Architecture Domain Hooks
  const authDomain = useAuthDomain({
    currentUser,
    setCurrentUser,
    users,
    setUsers,
    syncUserToBackend,
    deleteDocFromFirestore,
    logAction,
  });

  const farmProfileDomain = useFarmProfileDomain({
    farmProfile,
    setFarmProfile,
    setMongoStatus,
    saveDocToFirestore,
    logAction,
  });

  const flockDomain = useFlockDomain({
    currentUser,
    flocks,
    setFlocks,
    transfers,
    setTransfers,
    depletions,
    setDepletions,
    bodyWeights,
    setBodyWeights,
    saveDocToFirestore,
    deleteDocFromFirestore,
    logAction,
  });

  const eggAndHatcheryDomain = useEggAndHatcheryDomain({
    currentUser,
    flocks,
    flockStatsByHouseMap: flockDomain.flockStatsByHouseMap,
    getFlockStats: flockDomain.getFlockStats,
    rawEggRecords,
    setRawEggRecords,
    weeklyEggWeights,
    setWeeklyEggWeights,
    deliveries,
    setDeliveries,
    hatchingSummaries,
    setHatchingSummaries,
    saveDocToFirestore,
    deleteDocFromFirestore,
    logAction,
  });

  const feedHealthBiosecurityDomain = useFeedHealthBiosecurityDomain({
    currentUser,
    flocks,
    flockStatsByHouseMap: flockDomain.flockStatsByHouseMap,
    farmProfile,
    feedStockEntries,
    setFeedStockEntries,
    feedConsumptionRecords,
    setFeedConsumptionRecords,
    medProducts,
    setMedProducts,
    medStockLogs,
    setMedStockLogs,
    medAdministrations,
    setMedAdministrations,
    biosecurityRequirements,
    setBiosecurityRequirements,
    biosecurityLogs,
    setBiosecurityLogs,
    biosecuritySummaries,
    setBiosecuritySummaries,
    pendingWritesRef,
    saveDocToFirestore,
    deleteDocFromFirestore,
    logAction,
  });

  // System Reset, Cycle Clearing & JSON Backup Import/Export
  const resetAllDataToDefaults = useCallback(async () => {
    await purgeDatabaseAndCache({
      purgeDatabase: true,
      clearCache: true,
      preserveUsers: true,
      preserveFarmProfile: true,
      preserveStandards: true,
    });
    logAction(
      'SYSTEM_RESET',
      'admin',
      'Reset database and cache: removed all persistent and recurring records.'
    );
  }, [purgeDatabaseAndCache, logAction]);

  const clearDatabaseForNewCycle = useCallback(async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    await purgeOldDataFromMongoDB({
      preserveUsers: true,
      preserveStandards: true,
      preserveFarmProfile: true,
    });
    await clearAllLocalCacheAndStorage();

    setFlocks([]);
    setRawEggRecords([]);
    setWeeklyEggWeights([]);
    setDeliveries([]);
    setFeedStockEntries([]);
    setFeedConsumptionRecords([]);
    setDepletions([]);
    setTransfers([]);
    setMedProducts([]);
    setMedStockLogs([]);
    setMedAdministrations([]);
    setBodyWeights([]);
    setBiosecurityLogs([]);
    setHatchingSummaries([]);

    const newLog: SystemLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'usr_admin',
      userName: currentUser?.fullName || 'System Administrator',
      userRole: currentUser?.role || 'admin',
      action: 'CYCLE_CLEARED',
      category: 'admin',
      details:
        'All flock production, egg collections, feed logs, deliveries, and mortality history cleared to start a fresh cycle.',
    };
    setSystemLogs(prev => [newLog, ...prev.slice(0, 150)]);

    await refreshStorageQuota();

    return {
      success: true,
      message:
        'Database successfully cleared for new cycle. All persistent collections have been reset.',
    };
  }, [currentUser?.id, currentUser?.fullName, currentUser?.role, refreshStorageQuota]);

  const exportDataJson = useCallback((): string => {
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
      deliveries,
      systemLogs,
      biosecurityRequirements,
      biosecurityLogs,
      biosecuritySummaries,
    };
    return JSON.stringify(payload, null, 2);
  }, [
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
    rawEggRecords,
    weeklyEggWeights,
    deliveries,
    systemLogs,
    biosecurityRequirements,
    biosecurityLogs,
    biosecuritySummaries,
  ]);

  const importDataJson = useCallback(
    (jsonStr: string): boolean => {
      try {
        const data = JSON.parse(jsonStr);
        if (!data || typeof data !== 'object') return false;
        mutationEpochRef.current += 1;
        if (data.farmProfile) setFarmProfile(data.farmProfile);
        if (data.users) setUsers(deduplicateUsers(data.users));
        if (data.flocks) setFlocks(deduplicateFlocks(data.flocks));
        if (data.feedStockEntries) setFeedStockEntries(deduplicateById(data.feedStockEntries));
        if (data.feedConsumptionRecords)
          setFeedConsumptionRecords(deduplicateById(data.feedConsumptionRecords));
        if (data.depletions) setDepletions(deduplicateById(data.depletions));
        if (data.transfers) setTransfers(deduplicateById(data.transfers));
        if (data.medProducts) setMedProducts(deduplicateById(data.medProducts));
        if (data.medAdministrations)
          setMedAdministrations(deduplicateById(data.medAdministrations));
        if (data.bodyWeights) setBodyWeights(deduplicateById(data.bodyWeights));
        if (data.eggProductionRecords)
          setRawEggRecords(deduplicateById(data.eggProductionRecords));
        if (data.weeklyEggWeights) setWeeklyEggWeights(deduplicateById(data.weeklyEggWeights));
        if (data.deliveries) setDeliveries(deduplicateById(data.deliveries));
        if (data.systemLogs) setSystemLogs(deduplicateById(data.systemLogs));
        if (data.biosecurityRequirements)
          setBiosecurityRequirements(deduplicateById(data.biosecurityRequirements));
        if (data.biosecurityLogs) setBiosecurityLogs(deduplicateById(data.biosecurityLogs));
        if (data.biosecuritySummaries) setBiosecuritySummaries(data.biosecuritySummaries);

        pendingWritesRef.current += 1;
        syncAllDataToMongoDB({
          farmProfile: data.farmProfile,
          users: data.users,
          flocks: data.flocks,
          feedStock: data.feedStockEntries,
          feedRecords: data.feedConsumptionRecords,
          depletions: data.depletions,
          transfers: data.transfers,
          medProducts: data.medProducts,
          medAdmins: data.medAdministrations,
          bodyWeights: data.bodyWeights,
          eggRecords: data.eggProductionRecords,
          weeklyEggWeights: data.weeklyEggWeights,
          deliveries: data.deliveries,
          auditLogs: data.systemLogs,
          biosecurityRequirements: data.biosecurityRequirements,
          biosecurityLogs: data.biosecurityLogs,
          biosecuritySummaries: data.biosecuritySummaries,
        }).finally(() => {
          pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
        });

        logAction(
          'IMPORT_DATA',
          'admin',
          'Successfully imported backup database from external JSON file.'
        );
        return true;
      } catch {
        return false;
      }
    },
    [logAction]
  );

  // Role-Based Access Control (RBAC) Policy Engine
  const permissions: PermissionCheck = useMemo(
    () => buildRolePermissions(currentUser?.role, currentUser?.designatedHouses),
    [currentUser?.role, currentUser?.designatedHouses]
  );

  return (
    <FarmContext.Provider
      value={{
        currentUser,
        users,
        ...authDomain,

        farmProfile,
        ...farmProfileDomain,

        flocks,
        transfers,
        depletions,
        bodyWeights,
        addFlock: flockDomain.addFlock,
        updateFlock: flockDomain.updateFlock,
        deleteFlock: flockDomain.deleteFlock,
        getFlockStats: flockDomain.getFlockStats,
        addTransfer: flockDomain.addTransfer,
        deleteTransfer: flockDomain.deleteTransfer,
        addDepletion: flockDomain.addDepletion,
        deleteDepletion: flockDomain.deleteDepletion,
        addBodyWeightRecord: flockDomain.addBodyWeightRecord,
        deleteBodyWeightRecord: flockDomain.deleteBodyWeightRecord,

        feedStockEntries,
        feedConsumptionRecords,
        medProducts,
        medStockLogs,
        medAdministrations,
        biosecurityRequirements,
        biosecurityLogs,
        biosecuritySummaries,
        ...feedHealthBiosecurityDomain,

        weeklyEggWeights,
        deliveries,
        hatchingSummaries,
        ...eggAndHatcheryDomain,

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
        mongoStatus,
        syncAllToMongoDB,
        pullAllFromMongoDB,
        purgeDatabaseAndCache,

        firestoreStatus,
        syncAllToFirestore: syncAllToMongoDB,
        pullAllFromFirestore: pullAllFromMongoDB,

        storageQuota,
        refreshStorageQuota,

        permissions,
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
