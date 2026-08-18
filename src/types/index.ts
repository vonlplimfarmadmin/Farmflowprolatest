export type UserRole = 
  | 'admin'
  | 'farm_manager'
  | 'flockman'
  | 'leadman'
  | 'egg_collector'
  | 'System Administrator'
  | 'Farm Manager'
  | 'Flockman'
  | 'Leadman'
  | 'Egg Collector';

export type UserStatus = 'pending' | 'active' | 'approved' | 'rejected' | 'suspended' | 'disabled';

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  designatedHouses: string[]; // e.g. ['House 1', 'House 2']
  createdAt: string;
  registeredAt?: string;
  lastLogin?: string;
  securityQuestion: string;
  securityAnswer: string;
  contactNumber?: string;
}

export type User = UserAccount;

export type BreedType = 'Ross' | 'Cobb' | 'Ross 308' | 'Cobb 500';

export interface PenConfig {
  id: string;
  name: string; // e.g. "Pen L1"
  side: 'Left' | 'Right';
  males: number;
  females: number;
}

export interface Flock {
  id: string;
  houseNumber: string; // e.g. "House 1"
  breed: BreedType;
  loadingDateMale: string;
  loadingDateFemale: string;
  initialMales: number;
  initialFemales: number;
  currentMales: number;
  currentFemales: number;
  hatchDate?: string;
  status: 'active' | 'depleted' | 'culling';
  notes?: string;
  pens?: PenConfig[];
}

export type FeedType = 
  | 'CSC 1'
  | 'CSC 2'
  | 'CGC'
  | 'PDC'
  | 'BLC 1'
  | 'BLC 2'
  | 'BLC 3'
  | 'BMCC'
  | 'BMCR';

export interface FeedStockEntry {
  id: string;
  feedType: FeedType;
  bags: number;
  kgPerBag: number; // default 50
  totalKg: number;
  date: string;
  batchNumber?: string;
  supplier?: string;
  notes?: string;
  createdAt: string;
}

export interface FeedConsumptionRecord {
  id: string;
  houseNumber: string;
  date: string;
  side?: 'Left' | 'Right' | 'All';
  penId?: string;
  feedType: FeedType;
  quantityKg: number;
  targetKg?: number;
  loggedBy: string;
  notes?: string;
  createdAt: string;
}

export type DepletionReason = 'Mortality' | 'Spot Cull' | 'Missex' | 'Spent Cull';

export interface DepletionRecord {
  id: string;
  houseNumber: string;
  date: string;
  side: 'Left' | 'Right';
  penName?: string;
  category: DepletionReason;
  maleCount: number;
  femaleCount: number;
  sourceModule: 'flockman' | 'mortality_mgmt';
  reasonDetails?: string;
  loggedBy: string;
  createdAt: string;
}

export type ProductType = 
  | 'Vaccine'
  | 'Medicine'
  | 'Supplement'
  | 'Antibiotic'
  | 'Disinfectant'
  | 'paraphernalias'
  | 'Vitamins'
  | 'Dewormer';

export type MedProductType = ProductType;

export type UnitType = 'Vial' | 'bottle' | 'bag' | 'box' | 'piece';

export interface MedProduct {
  id: string;
  name: string;
  type: ProductType;
  manufacturer: string;
  manufacturingDate: string;
  expirationDate: string;
  expiryDate?: string;
  unitType: UnitType;
  packaging?: string;
  supplier?: string;
  dosage?: string;
  dosesPerUnit: number;
  currentStockUnits: number; // in units (vials, bottles, bags)
  currentStock?: number;
  minAlertUnits?: number;
  notes?: string;
}

export interface MedStockLog {
  id: string;
  productId: string;
  productName: string;
  date: string;
  unitsAdded: number;
  lotNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface MedAdministrationRecord {
  id: string;
  houseNumber: string;
  date: string;
  productId: string;
  productName: string;
  productType: ProductType;
  method: 'Drinking Water' | 'Eye Drop' | 'Wing Web' | 'Spray' | 'Subcutaneous Injection' | 'Intramuscular Injection' | 'Feed Mix' | 'Disinfection Spray' | 'Other' | string;
  unitsUsed: number;
  quantityDoses?: number;
  totalDosesAdministered: number;
  peripheralsUsed: string; // e.g. "Automatic vaccinator, 0.5ml needles, dye"
  administeredBy?: string;
  status?: 'completed' | 'scheduled' | 'cancelled';
  loggedBy: string;
  notes?: string;
  createdAt: string;
}

export interface StandardMedProgramItem {
  id: string;
  ageWeek: number;
  ageDays?: number;
  productName: string;
  productType: ProductType;
  diseaseTarget: string; // e.g. "ND + IB + IBD"
  method: string;
  mandatory: boolean;
  notes?: string;
}

export interface StandardFeedGuideItem {
  id: string;
  ageWeek: number;
  productionPhase: string;
  maleGramsPerBird: number;
  femaleGramsPerBird: number;
  recommendedFeedType: FeedType;
}

export interface StandardHendayItem {
  id: string;
  ageWeek: number;
  ageInProduction: number; // e.g. Week 1 of production = 24 weeks age
  standardHendayPct: number;
  standardHatchingPct: number;
}

export interface StandardBodyWeightItem {
  id: string;
  ageWeek: number;
  maleStandardGrams: number;
  femaleStandardGrams: number;
  toleranceMinGrams?: number;
  toleranceMaxGrams?: number;
}

export interface StandardEggWeightItem {
  id: string;
  ageWeek: number;
  ageInProduction: number;
  standardWeightGrams: number;
}

export interface BodyWeightRecord {
  id: string;
  houseNumber: string;
  week: number;
  date: string;
  maleAvgWeightGrams: number;
  femaleAvgWeightGrams: number;
  sampleSize?: number;
  uniformityPct?: number;
  weeklyGainMale?: number;
  weeklyGainFemale?: number;
  loggedBy: string;
  notes?: string;
  createdAt: string;
}

export interface EggCollectionEntry {
  id: string;
  collectionNumber: number;
  collectionTime: string;
  leftSideCount: number;
  rightSideCount: number;
  totalCount: number;
}

export interface EggSortingBreakdown {
  hatchingEggs: {
    total: number;
    heNest: number;
    heFloor: number;
    jumbo?: number;
    extraLarge?: number;
    large?: number;
    medium?: number;
    small?: number;
    peeWee?: number;
  };
  nonHatchingEggs: {
    total: number;
    dirty: number;
    cracked: number;
    broken: number;
    abnormal: number;
    doubleYolk: number;
    softShelled: number;
    misshapen: number;
    leakers: number;
    small?: number;
    thinShell?: number;
    others?: number;
  };
}

export interface EggProductionRecord {
  id: string;
  houseNumber: string; // e.g. "House 1"
  date: string; // YYYY-MM-DD
  
  // Standard egg fields
  heNest?: number;
  heFloor?: number;
  small?: number;
  thinShell?: number;
  misshape?: number;
  doubleYolk?: number;
  broken?: number;
  spoiled?: number;
  others?: number;
  
  // High-level computed properties
  totalHE?: number;
  totalNHE?: number;
  tep?: number;
  totalEggs?: number;
  totalHatchingEggs?: number;
  totalNonHatchingEggs?: number;
  hatchingEggPct?: number;
  nonHatchingEggPct?: number;
  hendayPct?: number;
  
  // Extended fields
  collections?: EggCollectionEntry[];
  sorting?: EggSortingBreakdown;
  sampleEggWeightGrams?: number;
  femalePopulationAtDate?: number;
  
  loggedBy: string;
  notes?: string;
  createdAt: string;
}

export interface WeeklyEggWeightRecord {
  id: string;
  houseNumber: string;
  date: string;
  ageInProductionWeeks: number;
  weightGrams: number;
  sampleSize?: number;
  loggedBy: string;
  notes?: string;
  createdAt: string;
}

export interface FarmProfile {
  name: string;
  logoUrl?: string;
  address: string;
  contactNumber: string;
  email: string;
  establishedYear: string;
  currency: string;
  standardVaccinationProgram: StandardMedProgramItem[];
  standardFeedGuide: StandardFeedGuideItem[];
  standardHenday: StandardHendayItem[];
  standardBodyWeights: StandardBodyWeightItem[];
  standardEggWeights: StandardEggWeightItem[];
}

export interface SystemLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  category: 'auth' | 'flock' | 'feed' | 'mortality' | 'medicine' | 'bodyweight' | 'egg_prod' | 'admin';
  module?: string;
  performedBy?: string;
  details: string;
  houseNumber?: string;
}

export type ModuleType = 
  | 'dashboard'
  | 'farm_profile'
  | 'feed_inventory'
  | 'flock'
  | 'flockman'
  | 'mortality'
  | 'medicine'
  | 'body_weight'
  | 'egg_production'
  | 'settings';
