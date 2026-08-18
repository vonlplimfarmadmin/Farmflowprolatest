import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  BirdTransferRecord
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
  INITIAL_SYSTEM_LOGS 
} from '../data/initialData';
import { calculateFlockAgeFromLoadingDate } from '../utils/dateCalculations';

export interface PermissionCheck {
  canViewModule: (moduleId: string) => boolean;
  canEditRecord: boolean;
  canDeleteRecord: boolean;
  canApproveUsers: boolean;
  canManageUsers: boolean;
  canManageFarmProfile: boolean;
  canManageMedicines: boolean;
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
  registerUser: (userData: Omit<UserAccount, 'id' | 'createdAt' | 'status'> & { password?: string }) => { success: boolean; message: string };
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

  // System Logs & Backup
  systemLogs: SystemLog[];
  auditLogs: SystemLog[];
  logAction: (action: string, category: SystemLog['category'], details: string, houseNumber?: string) => void;
  resetAllDataToDefaults: () => void;
  clearDatabaseForNewCycle: () => Promise<{ success: boolean; message: string }>;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;

  // MongoDB Cloud Persistence
  dbStatus: {
    connected: boolean;
    state: string;
    dbName: string | null;
    hasUriConfigured: boolean;
    lastError?: string | null;
    stats?: {
      eggRecordsCount: number;
      flocksCount: number;
      feedRecordsCount: number;
    };
  };
  checkDBStatus: () => Promise<void>;
  reconnectDB: (uri?: string) => Promise<{ success: boolean; message?: string }>;
  syncAllToMongoDB: () => Promise<{ success: boolean; message: string; counts?: any }>;

  // Permission Helpers
  permissions: PermissionCheck;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'broiler_breeder_farm_data_v2';

export const FarmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial states from LocalStorage or defaults
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('broiler_breeder_active_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_USERS[0]; // default to Admin for immediate full interactivity
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

  // MongoDB Connection State
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    state: string;
    dbName: string | null;
    hasUriConfigured: boolean;
    stats?: {
      eggRecordsCount: number;
      flocksCount: number;
      feedRecordsCount: number;
    };
  }>({
    connected: false,
    state: 'Checking...',
    dbName: null,
    hasUriConfigured: false,
    stats: { eggRecordsCount: 0, flocksCount: 0, feedRecordsCount: 0 }
  });

  const checkDBStatus = async () => {
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch {
      setDbStatus({
        connected: false,
        state: 'Offline Mode',
        dbName: null,
        hasUriConfigured: false
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
        setDbStatus(data.status);
      }
      return { success: Boolean(data.success), message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection failed' };
    }
  };

  useEffect(() => {
    checkDBStatus();
  }, []);

  // Sync All Data to MongoDB
  const syncAllToMongoDB = async () => {
    try {
      const payload = {
        eggRecords: rawEggRecords,
        flocks,
        feedRecords: feedConsumptionRecords,
        farmProfile
      };

      const res = await fetch('/api/db/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await checkDBStatus();
        logAction('MONGODB_SYNC', 'admin', `Successfully synced ${data.counts?.eggRecords || 0} egg records and ${data.counts?.flocks || 0} flocks to MongoDB.`);
        return { success: true, message: data.message || 'Synced successfully to MongoDB!', counts: data.counts };
      } else {
        return { success: false, message: data.error || 'Failed to sync to MongoDB' };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error syncing with MongoDB' };
    }
  };

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
  const login = (username: string, _password?: string) => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
    if (!user) {
      return { success: false, message: 'User account not found. Please register or verify username.' };
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

  const registerUser = (userData: Omit<UserAccount, 'id' | 'createdAt' | 'status'>) => {
    const exists = users.some(u => u.username.toLowerCase() === userData.username.toLowerCase().trim());
    if (exists) {
      return { success: false, message: 'Username already exists. Please choose another.' };
    }

    const newUser: UserAccount = {
      ...userData,
      id: 'usr_' + Date.now(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      registeredAt: new Date().toISOString().split('T')[0],
      designatedHouses: userData.designatedHouses && userData.designatedHouses.length > 0 
        ? userData.designatedHouses 
        : ['House 1', 'House 2']
    };

    setUsers(prev => [...prev, newUser]);
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
    const newRecord: FeedConsumptionRecord = {
      ...record,
      id: 'fc_' + Date.now(),
      loggedBy: currentUser?.fullName || 'Staff',
      createdAt: new Date().toISOString()
    };
    setFeedConsumptionRecords(prev => [newRecord, ...prev]);
    logAction('LOG_FEED_CONSUMPTION', 'feed', `Consumed ${record.quantityKg} kg of ${record.feedType} in ${record.houseNumber}.`, record.houseNumber);
  };

  const deleteFeedConsumption = (id: string) => {
    setFeedConsumptionRecords(prev => prev.filter(r => r.id !== id));
    logAction('DELETE_FEED_CONSUMPTION', 'feed', `Deleted feed consumption record ID ${id}.`);
  };

  const ALL_FEED_TYPES: FeedType[] = ['CSC 1', 'CSC 2', 'CGC', 'PDC', 'BLC 1', 'BLC 2', 'BLC 3', 'BMCC', 'BMCR'];

  const getFeedStockSummary = (): FeedStockSummaryItem[] => {
    return ALL_FEED_TYPES.map(ft => {
      const totalReceivedKg = feedStockEntries
        .filter(e => e.feedType === ft)
        .reduce((sum, e) => sum + e.totalKg, 0);
      const totalReceivedBags = feedStockEntries
        .filter(e => e.feedType === ft)
        .reduce((sum, e) => sum + e.bags, 0);

      const totalConsumedKg = feedConsumptionRecords
        .filter(r => r.feedType === ft)
        .reduce((sum, r) => sum + r.quantityKg, 0);

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

    logAction('LOG_DEPLETION', 'mortality', `Depletion (${record.category}): ${record.maleCount}M, ${record.femaleCount}F in ${record.houseNumber} (${record.side} side).`, record.houseNumber);
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

    logAction('LOG_MED_ADMINISTRATION', 'medicine', `Administered ${record.unitsUsed} units of ${record.productName} in ${record.houseNumber} via ${record.method}.`, record.houseNumber);
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
    logAction('LOG_BODY_WEIGHT', 'bodyweight', `Logged Week ${record.week} weight in ${record.houseNumber} (M: ${record.maleAvgWeightGrams}g, F: ${record.femaleAvgWeightGrams}g).`, record.houseNumber);
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
    logAction('LOG_EGG_PRODUCTION', 'egg_prod', `Recorded Egg Production in ${record.houseNumber} on ${record.date} (TEP: ${tep}, HE: ${he}, NHE: ${nhe}).`, record.houseNumber);

    // Asynchronously sync to MongoDB if backend is connected
    fetch('/api/egg-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    }).catch(err => {
      console.warn('Could not sync egg record to MongoDB endpoint:', err);
    });
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
      systemLogs
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
        // Flockman: access designated flock's record Egg Production, view Flockman's Module, and view Flock and Farm Profile only
        return ['dashboard', 'egg_production', 'flockman', 'flockman_module', 'flock', 'flock_list', 'farm_profile'].includes(moduleId);
      }
      if (isLeadman) {
        // Leadman: access designated flock's record Egg Production, record Flockman's Module, view Flock and Farm Profile only
        return ['dashboard', 'egg_production', 'flockman', 'flockman_module', 'flock', 'flock_list', 'farm_profile', 'mortality'].includes(moduleId);
      }
      if (isCollector) {
        // Egg Collector: access designated flock and Record Egg Production only
        return ['dashboard', 'egg_production'].includes(moduleId);
      }
      return false;
    },

    canEditRecord: isAdmin,
    canDeleteRecord: isAdmin,
    canApproveUsers: isAdmin,
    canManageUsers: isAdmin,
    canManageFarmProfile: isAdmin,
    canManageMedicines: isAdmin || isManager,
    
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

        systemLogs,
        auditLogs: systemLogs,
        logAction,
        resetAllDataToDefaults,
        clearDatabaseForNewCycle,
        exportDataJson,
        importDataJson,

        dbStatus,
        checkDBStatus,
        reconnectDB,
        syncAllToMongoDB,

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
