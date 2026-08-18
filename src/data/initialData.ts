import { 
  FarmProfile, 
  Flock, 
  FeedStockEntry, 
  FeedConsumptionRecord,
  MedProduct, 
  MedAdministrationRecord,
  BodyWeightRecord,
  EggProductionRecord,
  WeeklyEggWeightRecord,
  UserAccount,
  DepletionRecord,
  SystemLog
} from '../types';

export const INITIAL_FARM_PROFILE: FarmProfile = {
  name: 'L.P. LIM CITY FAMILY FARM INC',
  logoUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=200&q=80',
  address: 'San Jose Agro-Industrial Complex, Batangas / Central Luzon, Philippines',
  contactNumber: '+63 917 555 2473 / (043) 723-8890',
  email: 'von.lplimfarm@gmail.com',
  establishedYear: '2012',
  currency: 'PHP',
  standardVaccinationProgram: [
    { id: 'v1', ageWeek: 1, ageDays: 1, productName: 'Marek\'s HVT + Rispens', productType: 'Vaccine', diseaseTarget: 'Marek\'s Disease', method: 'Subcutaneous Injection', mandatory: true, notes: 'Hatchery administered' },
    { id: 'v2', ageWeek: 1, ageDays: 7, productName: 'Newcastle B1 + Bronchitis Mass', productType: 'Vaccine', diseaseTarget: 'ND + IB', method: 'Eye Drop', mandatory: true, notes: 'Individual bird application' },
    { id: 'v3', ageWeek: 2, ageDays: 14, productName: 'Gumboro D78 Live', productType: 'Vaccine', diseaseTarget: 'Infectious Bursal Disease (IBD)', method: 'Drinking Water', mandatory: true, notes: 'Skim milk stabilizer added' },
    { id: 'v4', ageWeek: 4, ageDays: 28, productName: 'Fowl Pox Live Wing Web', productType: 'Vaccine', diseaseTarget: 'Avian Pox', method: 'Wing Web', mandatory: true, notes: 'Check take at 7-10 days' },
    { id: 'v5', ageWeek: 6, ageDays: 42, productName: 'Avian Encephalomyelitis (AE)', productType: 'Vaccine', diseaseTarget: 'Epidemic Tremor', method: 'Drinking Water', mandatory: true, notes: 'Minimum 8 weeks before laying' },
    { id: 'v6', ageWeek: 8, ageDays: 56, productName: 'Infectious Coryza Killed 3-Valent', productType: 'Vaccine', diseaseTarget: 'Coryza A, B, C', method: 'Intramuscular Injection', mandatory: true, notes: 'Breast muscle injection' },
    { id: 'v7', ageWeek: 12, ageDays: 84, productName: 'ND + IB + IBD Inactivated Oil Emulsion', productType: 'Vaccine', diseaseTarget: 'ND + IB + Gumboro', method: 'Intramuscular Injection', mandatory: true, notes: 'Booster prior to pre-lay' },
    { id: 'v8', ageWeek: 18, ageDays: 126, productName: 'ND+IB+EDS+Reo Killed Booster', productType: 'Vaccine', diseaseTarget: 'Egg Drop Syndrome + ND + IB + Reo', method: 'Intramuscular Injection', mandatory: true, notes: 'Pre-transfer final breeder defense' },
    { id: 'v9', ageWeek: 35, ageDays: 245, productName: 'Newcastle LaSota Clone Booster', productType: 'Vaccine', diseaseTarget: 'Newcastle Disease', method: 'Spray', mandatory: false, notes: 'Coarse spray mid-lay immunity refresher' },
    { id: 'v10', ageWeek: 48, ageDays: 336, productName: 'ND + IB Live Booster', productType: 'Vaccine', diseaseTarget: 'ND + IB', method: 'Drinking Water', mandatory: false, notes: 'Late production immunity maintenance' }
  ],
  standardFeedGuide: [
    { id: 'fg1', ageWeek: 1, productionPhase: 'Brooding', maleGramsPerBird: 22, femaleGramsPerBird: 20, recommendedFeedType: 'CSC 1' },
    { id: 'fg2', ageWeek: 3, productionPhase: 'Brooding / Starter', maleGramsPerBird: 38, femaleGramsPerBird: 35, recommendedFeedType: 'CSC 2' },
    { id: 'fg3', ageWeek: 8, productionPhase: 'Growing', maleGramsPerBird: 65, femaleGramsPerBird: 58, recommendedFeedType: 'CGC' },
    { id: 'fg4', ageWeek: 14, productionPhase: 'Developing', maleGramsPerBird: 85, femaleGramsPerBird: 75, recommendedFeedType: 'PDC' },
    { id: 'fg5', ageWeek: 20, productionPhase: 'Pre-Lay', maleGramsPerBird: 105, femaleGramsPerBird: 95, recommendedFeedType: 'BLC 1' },
    { id: 'fg6', ageWeek: 24, productionPhase: 'Onset of Lay (5%)', maleGramsPerBird: 115, femaleGramsPerBird: 120, recommendedFeedType: 'BLC 1' },
    { id: 'fg7', ageWeek: 28, productionPhase: 'Peak Production', maleGramsPerBird: 125, femaleGramsPerBird: 160, recommendedFeedType: 'BLC 1' },
    { id: 'fg8', ageWeek: 32, productionPhase: 'Peak to Post-Peak', maleGramsPerBird: 128, femaleGramsPerBird: 162, recommendedFeedType: 'BLC 2' },
    { id: 'fg9', ageWeek: 45, productionPhase: 'Mid-Lay Phase', maleGramsPerBird: 130, femaleGramsPerBird: 158, recommendedFeedType: 'BLC 2' },
    { id: 'fg10', ageWeek: 55, productionPhase: 'Late Lay Phase', maleGramsPerBird: 130, femaleGramsPerBird: 154, recommendedFeedType: 'BLC 3' }
  ],
  standardHenday: [
    { id: 'hd1', ageWeek: 24, ageInProduction: 1, standardHendayPct: 5.0, standardHatchingPct: 60.0 },
    { id: 'hd2', ageWeek: 25, ageInProduction: 2, standardHendayPct: 22.0, standardHatchingPct: 75.0 },
    { id: 'hd3', ageWeek: 26, ageInProduction: 3, standardHendayPct: 50.0, standardHatchingPct: 84.0 },
    { id: 'hd4', ageWeek: 27, ageInProduction: 4, standardHendayPct: 72.0, standardHatchingPct: 88.5 },
    { id: 'hd5', ageWeek: 28, ageInProduction: 5, standardHendayPct: 84.0, standardHatchingPct: 91.0 },
    { id: 'hd6', ageWeek: 30, ageInProduction: 7, standardHendayPct: 90.5, standardHatchingPct: 94.0 },
    { id: 'hd7', ageWeek: 32, ageInProduction: 9, standardHendayPct: 89.2, standardHatchingPct: 94.5 },
    { id: 'hd8', ageWeek: 36, ageInProduction: 13, standardHendayPct: 86.0, standardHatchingPct: 93.8 },
    { id: 'hd9', ageWeek: 42, ageInProduction: 19, standardHendayPct: 81.5, standardHatchingPct: 92.5 },
    { id: 'hd10', ageWeek: 48, ageInProduction: 25, standardHendayPct: 76.0, standardHatchingPct: 90.0 },
    { id: 'hd11', ageWeek: 54, ageInProduction: 31, standardHendayPct: 70.0, standardHatchingPct: 87.0 },
    { id: 'hd12', ageWeek: 60, ageInProduction: 37, standardHendayPct: 63.5, standardHatchingPct: 84.0 },
    { id: 'hd13', ageWeek: 65, ageInProduction: 42, standardHendayPct: 57.0, standardHatchingPct: 80.0 }
  ],
  standardBodyWeights: [
    { id: 'bw1', ageWeek: 1, maleStandardGrams: 155, femaleStandardGrams: 140, toleranceMinGrams: 130, toleranceMaxGrams: 165 },
    { id: 'bw2', ageWeek: 4, maleStandardGrams: 580, femaleStandardGrams: 490, toleranceMinGrams: 460, toleranceMaxGrams: 520 },
    { id: 'bw3', ageWeek: 8, maleStandardGrams: 1250, femaleStandardGrams: 1020, toleranceMinGrams: 970, toleranceMaxGrams: 1070 },
    { id: 'bw4', ageWeek: 12, maleStandardGrams: 1850, femaleStandardGrams: 1450, toleranceMinGrams: 1380, toleranceMaxGrams: 1520 },
    { id: 'bw5', ageWeek: 16, maleStandardGrams: 2450, femaleStandardGrams: 1880, toleranceMinGrams: 1790, toleranceMaxGrams: 1970 },
    { id: 'bw6', ageWeek: 20, maleStandardGrams: 3050, femaleStandardGrams: 2280, toleranceMinGrams: 2170, toleranceMaxGrams: 2390 },
    { id: 'bw7', ageWeek: 24, maleStandardGrams: 3600, femaleStandardGrams: 2750, toleranceMinGrams: 2620, toleranceMaxGrams: 2880 },
    { id: 'bw8', ageWeek: 28, maleStandardGrams: 4050, femaleStandardGrams: 3250, toleranceMinGrams: 3100, toleranceMaxGrams: 3400 },
    { id: 'bw9', ageWeek: 32, maleStandardGrams: 4300, femaleStandardGrams: 3500, toleranceMinGrams: 3350, toleranceMaxGrams: 3650 },
    { id: 'bw10', ageWeek: 40, maleStandardGrams: 4550, femaleStandardGrams: 3750, toleranceMinGrams: 3580, toleranceMaxGrams: 3920 },
    { id: 'bw11', ageWeek: 50, maleStandardGrams: 4750, femaleStandardGrams: 3950, toleranceMinGrams: 3780, toleranceMaxGrams: 4120 },
    { id: 'bw12', ageWeek: 60, maleStandardGrams: 4900, femaleStandardGrams: 4100, toleranceMinGrams: 3920, toleranceMaxGrams: 4280 }
  ],
  standardEggWeights: [
    { id: 'ew1', ageWeek: 24, ageInProduction: 1, standardWeightGrams: 51.5 },
    { id: 'ew2', ageWeek: 26, ageInProduction: 3, standardWeightGrams: 55.0 },
    { id: 'ew3', ageWeek: 28, ageInProduction: 5, standardWeightGrams: 58.2 },
    { id: 'ew4', ageWeek: 30, ageInProduction: 7, standardWeightGrams: 60.5 },
    { id: 'ew5', ageWeek: 34, ageInProduction: 11, standardWeightGrams: 62.8 },
    { id: 'ew6', ageWeek: 40, ageInProduction: 17, standardWeightGrams: 64.9 },
    { id: 'ew7', ageWeek: 48, ageInProduction: 25, standardWeightGrams: 66.8 },
    { id: 'ew8', ageWeek: 56, ageInProduction: 33, standardWeightGrams: 68.2 },
    { id: 'ew9', ageWeek: 64, ageInProduction: 41, standardWeightGrams: 69.5 }
  ]
};

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr_admin',
    username: 'admin',
    fullName: 'Von L.P. Lim (Owner / Admin)',
    email: 'von.lplimfarm@gmail.com',
    role: 'admin',
    status: 'active',
    designatedHouses: ['House 1', 'House 2', 'House 3', 'House 4', 'House 5', 'House 6'],
    createdAt: '2026-01-01T08:00:00Z',
    lastLogin: '2026-08-17T08:15:00Z',
    securityQuestion: 'What is your farm location?',
    securityAnswer: 'Batangas',
    contactNumber: '+63 917 555 2473'
  },
  {
    id: 'usr_manager',
    username: 'farm_mgr_ramon',
    fullName: 'Ramon De Jesus (Farm Operations Manager)',
    email: 'ramon.operations@lplimfarm.com',
    role: 'farm_manager',
    status: 'active',
    designatedHouses: ['House 1', 'House 2', 'House 3', 'House 4', 'House 5', 'House 6'],
    createdAt: '2026-01-15T09:00:00Z',
    lastLogin: '2026-08-17T07:45:00Z',
    securityQuestion: 'What is your favorite breed?',
    securityAnswer: 'Cobb 500',
    contactNumber: '+63 918 222 1984'
  },
  {
    id: 'usr_leadman',
    username: 'leadman_eduardo',
    fullName: 'Eduardo Santos (Senior Leadman)',
    email: 'eduardo.santos@lplimfarm.com',
    role: 'leadman',
    status: 'active',
    designatedHouses: ['House 1', 'House 2', 'House 3'],
    createdAt: '2026-02-01T08:00:00Z',
    lastLogin: '2026-08-16T17:30:00Z',
    securityQuestion: 'What was the first house you managed?',
    securityAnswer: 'House 1',
    contactNumber: '+63 920 333 4455'
  },
  {
    id: 'usr_flockman1',
    username: 'flockman_joel',
    fullName: 'Joel Bautista (Flockman H1 & H2)',
    email: 'joel.bautista@lplimfarm.com',
    role: 'flockman',
    status: 'active',
    designatedHouses: ['House 1', 'House 2'],
    createdAt: '2026-02-10T10:00:00Z',
    lastLogin: '2026-08-16T16:00:00Z',
    securityQuestion: 'What town were you born in?',
    securityAnswer: 'Lipa',
    contactNumber: '+63 929 111 8877'
  },
  {
    id: 'usr_egg_collector',
    username: 'collector_marlon',
    fullName: 'Marlon Ramos (Head Egg Collector)',
    email: 'marlon.collector@lplimfarm.com',
    role: 'egg_collector',
    status: 'active',
    designatedHouses: ['House 1', 'House 2', 'House 3', 'House 4', 'House 5', 'House 6'],
    createdAt: '2026-03-01T07:30:00Z',
    lastLogin: '2026-08-17T06:00:00Z',
    securityQuestion: 'What is your primary collection session?',
    securityAnswer: 'Morning',
    contactNumber: '+63 947 888 2211'
  },
  {
    id: 'usr_pending_applicant',
    username: 'flockman_arnel',
    fullName: 'Arnel Mendoza (New Applicant)',
    email: 'arnel.mendoza@gmail.com',
    role: 'flockman',
    status: 'pending',
    designatedHouses: ['House 4'],
    createdAt: '2026-08-16T14:22:00Z',
    securityQuestion: 'What is your farm experience in years?',
    securityAnswer: '5 years',
    contactNumber: '+63 955 777 9900'
  }
];

export const INITIAL_FLOCKS: Flock[] = [
  {
    id: 'flock_h1',
    houseNumber: 'House 1',
    breed: 'Cobb 500',
    loadingDateMale: '2026-01-10',
    loadingDateFemale: '2026-01-10',
    initialMales: 980,
    initialFemales: 9350,
    currentMales: 910,
    currentFemales: 8920,
    hatchDate: '2025-12-15',
    status: 'active',
    notes: 'Flock in 34th week, steady production, good egg weight distribution.',
    pens: [
      { id: 'pen_h1_l1', name: 'Pen L1', side: 'Left', males: 230, females: 2230 },
      { id: 'pen_h1_l2', name: 'Pen L2', side: 'Left', males: 225, females: 2230 },
      { id: 'pen_h1_r1', name: 'Pen R1', side: 'Right', males: 228, females: 2230 },
      { id: 'pen_h1_r2', name: 'Pen R2', side: 'Right', males: 227, females: 2230 }
    ]
  },
  {
    id: 'flock_h2',
    houseNumber: 'House 2',
    breed: 'Ross 308',
    loadingDateMale: '2026-01-18',
    loadingDateFemale: '2026-01-18',
    initialMales: 1020,
    initialFemales: 9600,
    currentMales: 955,
    currentFemales: 9280,
    hatchDate: '2025-12-22',
    status: 'active',
    notes: 'Flock in 33rd week, excellent shell quality and strong male fertility vigor.',
    pens: [
      { id: 'pen_h2_l1', name: 'Pen L1', side: 'Left', males: 240, females: 2320 },
      { id: 'pen_h2_l2', name: 'Pen L2', side: 'Left', males: 238, females: 2320 },
      { id: 'pen_h2_r1', name: 'Pen R1', side: 'Right', males: 239, females: 2320 },
      { id: 'pen_h2_r2', name: 'Pen R2', side: 'Right', males: 238, females: 2320 }
    ]
  },
  {
    id: 'flock_h3',
    houseNumber: 'House 3',
    breed: 'Cobb 500',
    loadingDateMale: '2025-10-05',
    loadingDateFemale: '2025-10-05',
    initialMales: 950,
    initialFemales: 8900,
    currentMales: 820,
    currentFemales: 7850,
    hatchDate: '2025-09-10',
    status: 'active',
    notes: 'Flock in 48th week, post-peak maintenance ration BLC 2, monitoring floor eggs.',
    pens: [
      { id: 'pen_h3_l1', name: 'Pen L1', side: 'Left', males: 205, females: 1960 },
      { id: 'pen_h3_l2', name: 'Pen L2', side: 'Left', males: 205, females: 1965 },
      { id: 'pen_h3_r1', name: 'Pen R1', side: 'Right', males: 205, females: 1960 },
      { id: 'pen_h3_r2', name: 'Pen R2', side: 'Right', males: 205, females: 1965 }
    ]
  },
  {
    id: 'flock_h4',
    houseNumber: 'House 4',
    breed: 'Ross 308',
    loadingDateMale: '2026-02-01',
    loadingDateFemale: '2026-02-01',
    initialMales: 1040,
    initialFemales: 9900,
    currentMales: 990,
    currentFemales: 9680,
    hatchDate: '2026-01-05',
    status: 'active',
    notes: 'Flock in 31st week, hitting peak lay numbers above 8,800 eggs/day.',
    pens: [
      { id: 'pen_h4_l1', name: 'Pen L1', side: 'Left', males: 250, females: 2420 },
      { id: 'pen_h4_l2', name: 'Pen L2', side: 'Left', males: 245, females: 2420 },
      { id: 'pen_h4_r1', name: 'Pen R1', side: 'Right', males: 248, females: 2420 },
      { id: 'pen_h4_r2', name: 'Pen R2', side: 'Right', males: 247, females: 2420 }
    ]
  },
  {
    id: 'flock_h5',
    houseNumber: 'House 5',
    breed: 'Cobb 500',
    loadingDateMale: '2026-01-25',
    loadingDateFemale: '2026-01-25',
    initialMales: 1000,
    initialFemales: 9400,
    currentMales: 940,
    currentFemales: 9150,
    hatchDate: '2025-12-28',
    status: 'active',
    notes: 'Flock in 32nd week, zero floor eggs observed, feed intake optimal.',
    pens: [
      { id: 'pen_h5_l1', name: 'Pen L1', side: 'Left', males: 235, females: 2285 },
      { id: 'pen_h5_l2', name: 'Pen L2', side: 'Left', males: 235, females: 2290 },
      { id: 'pen_h5_r1', name: 'Pen R1', side: 'Right', males: 235, females: 2285 },
      { id: 'pen_h5_r2', name: 'Pen R2', side: 'Right', males: 235, females: 2290 }
    ]
  },
  {
    id: 'flock_h6',
    houseNumber: 'House 6',
    breed: 'Ross 308',
    loadingDateMale: '2026-01-30',
    loadingDateFemale: '2026-01-30',
    initialMales: 1010,
    initialFemales: 9550,
    currentMales: 960,
    currentFemales: 9380,
    hatchDate: '2026-01-02',
    status: 'active',
    notes: 'Flock in 31st week, healthy flock dynamics and solid hatchability rates.',
    pens: [
      { id: 'pen_h6_l1', name: 'Pen L1', side: 'Left', males: 240, females: 2345 },
      { id: 'pen_h6_l2', name: 'Pen L2', side: 'Left', males: 240, females: 2345 },
      { id: 'pen_h6_r1', name: 'Pen R1', side: 'Right', males: 240, females: 2345 },
      { id: 'pen_h6_r2', name: 'Pen R2', side: 'Right', males: 240, females: 2345 }
    ]
  }
];

export const INITIAL_FEED_STOCK: FeedStockEntry[] = [
  { id: 'fs1', feedType: 'CSC 1', bags: 120, kgPerBag: 50, totalKg: 6000, date: '2026-08-10', batchNumber: 'LOT-CSC1-8801', supplier: 'San Miguel B-MEG Feed Mills', notes: 'Brooding starter bags', createdAt: '2026-08-10T09:00:00Z' },
  { id: 'fs2', feedType: 'CSC 2', bags: 3, kgPerBag: 50, totalKg: 150, date: '2026-08-08', batchNumber: 'LOT-CSC2-8750', supplier: 'San Miguel B-MEG Feed Mills', notes: 'Low stock warning test case', createdAt: '2026-08-08T10:30:00Z' },
  { id: 'fs3', feedType: 'CGC', bags: 85, kgPerBag: 50, totalKg: 4250, date: '2026-08-12', batchNumber: 'LOT-CGC-9102', supplier: 'Universal Robina Feeds', notes: 'Grower crumble', createdAt: '2026-08-12T14:00:00Z' },
  { id: 'fs4', feedType: 'PDC', bags: 4, kgPerBag: 50, totalKg: 200, date: '2026-08-11', batchNumber: 'LOT-PDC-4421', supplier: 'Universal Robina Feeds', notes: 'Low stock critical', createdAt: '2026-08-11T11:00:00Z' },
  { id: 'fs5', feedType: 'BLC 1', bags: 380, kgPerBag: 50, totalKg: 19000, date: '2026-08-14', batchNumber: 'LOT-BLC1-9920', supplier: 'Cargill Animal Nutrition', notes: 'Breeder layer peak formula', createdAt: '2026-08-14T08:00:00Z' },
  { id: 'fs6', feedType: 'BLC 2', bags: 210, kgPerBag: 50, totalKg: 10500, date: '2026-08-14', batchNumber: 'LOT-BLC2-9921', supplier: 'Cargill Animal Nutrition', notes: 'Post-peak maintenance ration', createdAt: '2026-08-14T08:30:00Z' },
  { id: 'fs7', feedType: 'BLC 3', bags: 65, kgPerBag: 50, totalKg: 3250, date: '2026-08-05', batchNumber: 'LOT-BLC3-7710', supplier: 'Cargill Animal Nutrition', notes: 'Late stage breeder ration', createdAt: '2026-08-05T09:00:00Z' },
  { id: 'fs8', feedType: 'BMCC', bags: 95, kgPerBag: 50, totalKg: 4750, date: '2026-08-15', batchNumber: 'LOT-BMCC-1022', supplier: 'NutriFeed Philippines', notes: 'Breeder male clean crumble', createdAt: '2026-08-15T13:00:00Z' },
  { id: 'fs9', feedType: 'BMCR', bags: 45, kgPerBag: 50, totalKg: 2250, date: '2026-08-15', batchNumber: 'LOT-BMCR-1023', supplier: 'NutriFeed Philippines', notes: 'Breeder male clean ration', createdAt: '2026-08-15T13:30:00Z' }
];

export const INITIAL_FEED_CONSUMPTION: FeedConsumptionRecord[] = [
  { id: 'fc1', houseNumber: 'House 1', date: '2026-08-16', side: 'All', feedType: 'BLC 1', quantityKg: 1420, targetKg: 1425, loggedBy: 'Joel Bautista', notes: 'Normal clean-up time 3.5 hrs', createdAt: '2026-08-16T09:00:00Z' },
  { id: 'fc2', houseNumber: 'House 1', date: '2026-08-16', side: 'All', feedType: 'BMCC', quantityKg: 114, targetKg: 114, loggedBy: 'Joel Bautista', notes: 'Male feeding separate line', createdAt: '2026-08-16T09:15:00Z' },
  { id: 'fc3', houseNumber: 'House 2', date: '2026-08-16', side: 'All', feedType: 'BLC 1', quantityKg: 1480, targetKg: 1480, loggedBy: 'Joel Bautista', notes: 'Clean out 3.2 hrs', createdAt: '2026-08-16T09:30:00Z' },
  { id: 'fc4', houseNumber: 'House 2', date: '2026-08-16', side: 'All', feedType: 'BMCC', quantityKg: 122, targetKg: 122, loggedBy: 'Joel Bautista', notes: 'Male line feeding', createdAt: '2026-08-16T09:40:00Z' },
  { id: 'fc5', houseNumber: 'House 3', date: '2026-08-16', side: 'All', feedType: 'BLC 2', quantityKg: 1240, targetKg: 1240, loggedBy: 'Eduardo Santos', notes: 'Post-peak portion control', createdAt: '2026-08-16T09:00:00Z' },
  { id: 'fc6', houseNumber: 'House 3', date: '2026-08-16', side: 'All', feedType: 'BMCC', quantityKg: 104, targetKg: 104, loggedBy: 'Eduardo Santos', notes: 'Male weight steady', createdAt: '2026-08-16T09:10:00Z' },
  { id: 'fc7', houseNumber: 'House 4', date: '2026-08-16', side: 'All', feedType: 'BLC 1', quantityKg: 1545, targetKg: 1550, loggedBy: 'Eduardo Santos', notes: 'Peak intake peak performance', createdAt: '2026-08-16T09:20:00Z' },
  { id: 'fc8', houseNumber: 'House 4', date: '2026-08-16', side: 'All', feedType: 'BMCC', quantityKg: 126, targetKg: 126, loggedBy: 'Eduardo Santos', notes: 'Male feed verified', createdAt: '2026-08-16T09:30:00Z' },
  { id: 'fc9', houseNumber: 'House 5', date: '2026-08-16', side: 'All', feedType: 'BLC 1', quantityKg: 1460, targetKg: 1465, loggedBy: 'Ramon De Jesus', notes: 'Uniform distribution along pan feeders', createdAt: '2026-08-16T09:15:00Z' },
  { id: 'fc10', houseNumber: 'House 5', date: '2026-08-16', side: 'All', feedType: 'BMCC', quantityKg: 120, targetKg: 120, loggedBy: 'Ramon De Jesus', notes: 'Male feeder height adjusted', createdAt: '2026-08-16T09:25:00Z' },
  { id: 'fc11', houseNumber: 'House 6', date: '2026-08-16', side: 'All', feedType: 'BLC 1', quantityKg: 1500, targetKg: 1500, loggedBy: 'Ramon De Jesus', notes: 'Optimal intake', createdAt: '2026-08-16T09:45:00Z' },
  { id: 'fc12', houseNumber: 'House 6', date: '2026-08-16', side: 'All', feedType: 'BMCC', quantityKg: 123, targetKg: 123, loggedBy: 'Ramon De Jesus', notes: 'Male ration complete', createdAt: '2026-08-16T09:55:00Z' }
];

export const INITIAL_DEPLETIONS: DepletionRecord[] = [
  { id: 'dep1', houseNumber: 'House 1', date: '2026-08-16', side: 'Left', penName: 'Pen L1', category: 'Mortality', maleCount: 1, femaleCount: 3, sourceModule: 'flockman', reasonDetails: 'Routine mortality inspection', loggedBy: 'Joel Bautista', createdAt: '2026-08-16T08:00:00Z' },
  { id: 'dep2', houseNumber: 'House 1', date: '2026-08-16', side: 'Right', penName: 'Pen R2', category: 'Spot Cull', maleCount: 0, femaleCount: 2, sourceModule: 'mortality_mgmt', reasonDetails: 'Leg deformity and unthrifty female', loggedBy: 'Eduardo Santos', createdAt: '2026-08-16T11:00:00Z' },
  { id: 'dep3', houseNumber: 'House 2', date: '2026-08-16', side: 'Left', penName: 'Pen L2', category: 'Mortality', maleCount: 0, femaleCount: 2, sourceModule: 'flockman', reasonDetails: 'Natural mortality', loggedBy: 'Joel Bautista', createdAt: '2026-08-16T08:15:00Z' },
  { id: 'dep4', houseNumber: 'House 3', date: '2026-08-16', side: 'Right', penName: 'Pen R1', category: 'Spot Cull', maleCount: 1, femaleCount: 4, sourceModule: 'mortality_mgmt', reasonDetails: 'Overweight non-mating male + poor feathers', loggedBy: 'Ramon De Jesus', createdAt: '2026-08-16T14:30:00Z' },
  { id: 'dep5', houseNumber: 'House 4', date: '2026-08-16', side: 'Left', penName: 'Pen L1', category: 'Mortality', maleCount: 1, femaleCount: 2, sourceModule: 'flockman', reasonDetails: 'Morning check', loggedBy: 'Eduardo Santos', createdAt: '2026-08-16T08:00:00Z' },
  { id: 'dep6', houseNumber: 'House 5', date: '2026-08-16', side: 'Right', penName: 'Pen R1', category: 'Missex', maleCount: 0, femaleCount: 1, sourceModule: 'mortality_mgmt', reasonDetails: 'Late sexing correction', loggedBy: 'Eduardo Santos', createdAt: '2026-08-16T15:00:00Z' }
];

export const INITIAL_MED_PRODUCTS: MedProduct[] = [
  { id: 'med1', name: 'Nobilis ND Clone 30 + IB Ma5', type: 'Vaccine', manufacturer: 'MSD Animal Health', manufacturingDate: '2026-01-10', expirationDate: '2027-06-30', unitType: 'Vial', dosesPerUnit: 1000, currentStockUnits: 25, minAlertUnits: 5, notes: 'Live freeze dried vaccine' },
  { id: 'med2', name: 'Gallivac IBD intermediate plus', type: 'Vaccine', manufacturer: 'Boehringer Ingelheim', manufacturingDate: '2026-02-15', expirationDate: '2027-08-15', unitType: 'Vial', dosesPerUnit: 2500, currentStockUnits: 14, minAlertUnits: 3, notes: 'Water administration with blue dye' },
  { id: 'med3', name: 'Cevac Corymune 4K Inactivated', type: 'Vaccine', manufacturer: 'Ceva Animal Health', manufacturingDate: '2025-11-20', expirationDate: '2027-11-20', unitType: 'bottle', dosesPerUnit: 1000, currentStockUnits: 40, minAlertUnits: 8, notes: 'Injectable killed 4-strain bacterin' },
  { id: 'med4', name: 'Electro-Vits Breeder Electrolytes', type: 'Supplement', manufacturer: 'Vetracin Pharma', manufacturingDate: '2026-03-01', expirationDate: '2028-03-01', unitType: 'bag', dosesPerUnit: 5000, currentStockUnits: 32, minAlertUnits: 6, notes: 'Antistress water soluble powder' },
  { id: 'med5', name: 'Amoxy-Plus 50% Water Soluble', type: 'Antibiotic', manufacturer: 'Bayer Animal Health', manufacturingDate: '2026-01-05', expirationDate: '2028-01-05', unitType: 'bottle', dosesPerUnit: 2000, currentStockUnits: 8, minAlertUnits: 2, notes: 'Therapeutic respiratory and systemic treatment' },
  { id: 'med6', name: 'Virkon S Broad Spectrum Disinfectant', type: 'Disinfectant', manufacturer: 'Lanxess Biosecurity', manufacturingDate: '2026-04-10', expirationDate: '2029-04-10', unitType: 'bag', dosesPerUnit: 10000, currentStockUnits: 18, minAlertUnits: 4, notes: 'Foot bath and aerosol aerial spraying' },
  { id: 'med7', name: 'Socorex Automatic Syringe 0.5ml Set', type: 'paraphernalias', manufacturer: 'Socorex Isba Switzerland', manufacturingDate: '2025-05-01', expirationDate: '2035-01-01', unitType: 'piece', dosesPerUnit: 1, currentStockUnits: 12, minAlertUnits: 2, notes: 'Precision vaccination guns & spare parts' }
];

export const INITIAL_MED_ADMIN: MedAdministrationRecord[] = [
  { id: 'ma1', houseNumber: 'House 1', date: '2026-08-12', productId: 'med4', productName: 'Electro-Vits Breeder Electrolytes', productType: 'Supplement', method: 'Drinking Water', unitsUsed: 2, totalDosesAdministered: 10000, peripheralsUsed: 'Dosatron proportional medicator', loggedBy: 'Joel Bautista', notes: 'Post-handling antistress electrolyte booster', createdAt: '2026-08-12T07:30:00Z' },
  { id: 'ma2', houseNumber: 'House 4', date: '2026-08-05', productId: 'med1', productName: 'Nobilis ND Clone 30 + IB Ma5', productType: 'Vaccine', method: 'Spray', unitsUsed: 11, totalDosesAdministered: 11000, peripheralsUsed: 'Ulva+ Controlled Droplet Sprayer', loggedBy: 'Eduardo Santos', notes: 'Routine ND/IB booster spray at lights off', createdAt: '2026-08-05T19:00:00Z' },
  { id: 'ma3', houseNumber: 'House 3', date: '2026-08-08', productId: 'med6', productName: 'Virkon S Broad Spectrum Disinfectant', productType: 'Disinfectant', method: 'Disinfection Spray', unitsUsed: 1, totalDosesAdministered: 10000, peripheralsUsed: 'Stihl SR450 Mist Blower', loggedBy: 'Ramon De Jesus', notes: 'Perimeter biosecurity and entryway sanitation', createdAt: '2026-08-08T16:00:00Z' }
];

export const INITIAL_BODY_WEIGHTS: BodyWeightRecord[] = [
  { id: 'bw_h1_w32', houseNumber: 'House 1', week: 32, date: '2026-08-03', maleAvgWeightGrams: 4290, femaleAvgWeightGrams: 3495, sampleSize: 100, uniformityPct: 86.5, weeklyGainMale: 60, weeklyGainFemale: 50, loggedBy: 'Joel Bautista', notes: 'Consistent weight curve', createdAt: '2026-08-03T10:00:00Z' },
  { id: 'bw_h1_w33', houseNumber: 'House 1', week: 33, date: '2026-08-10', maleAvgWeightGrams: 4340, femaleAvgWeightGrams: 3535, sampleSize: 100, uniformityPct: 87.2, weeklyGainMale: 50, weeklyGainFemale: 40, loggedBy: 'Joel Bautista', notes: 'Within target tolerance', createdAt: '2026-08-10T10:00:00Z' },
  { id: 'bw_h1_w34', houseNumber: 'House 1', week: 34, date: '2026-08-17', maleAvgWeightGrams: 4390, femaleAvgWeightGrams: 3580, sampleSize: 100, uniformityPct: 88.0, weeklyGainMale: 50, weeklyGainFemale: 45, loggedBy: 'Joel Bautista', notes: 'Ideal condition score', createdAt: '2026-08-17T09:30:00Z' },
  
  { id: 'bw_h2_w31', houseNumber: 'House 2', week: 31, date: '2026-08-03', maleAvgWeightGrams: 4240, femaleAvgWeightGrams: 3460, sampleSize: 100, uniformityPct: 85.0, weeklyGainMale: 55, weeklyGainFemale: 45, loggedBy: 'Joel Bautista', notes: 'Ross standard alignment', createdAt: '2026-08-03T11:00:00Z' },
  { id: 'bw_h2_w32', houseNumber: 'House 2', week: 32, date: '2026-08-10', maleAvgWeightGrams: 4305, femaleAvgWeightGrams: 3510, sampleSize: 100, uniformityPct: 86.8, weeklyGainMale: 65, weeklyGainFemale: 50, loggedBy: 'Joel Bautista', notes: 'Good male fleshiness', createdAt: '2026-08-10T11:00:00Z' },
  { id: 'bw_h2_w33', houseNumber: 'House 2', week: 33, date: '2026-08-17', maleAvgWeightGrams: 4360, femaleAvgWeightGrams: 3560, sampleSize: 100, uniformityPct: 87.5, weeklyGainMale: 55, weeklyGainFemale: 50, loggedBy: 'Joel Bautista', notes: 'Strong male libido and weight control', createdAt: '2026-08-17T10:15:00Z' },

  { id: 'bw_h3_w46', houseNumber: 'House 3', week: 46, date: '2026-08-03', maleAvgWeightGrams: 4670, femaleAvgWeightGrams: 3880, sampleSize: 90, uniformityPct: 82.0, weeklyGainMale: 25, weeklyGainFemale: 20, loggedBy: 'Eduardo Santos', notes: 'Mature flock weight tracking', createdAt: '2026-08-03T14:00:00Z' },
  { id: 'bw_h3_w47', houseNumber: 'House 3', week: 47, date: '2026-08-10', maleAvgWeightGrams: 4690, femaleAvgWeightGrams: 3905, sampleSize: 90, uniformityPct: 82.5, weeklyGainMale: 20, weeklyGainFemale: 25, loggedBy: 'Eduardo Santos', notes: 'Steady weight', createdAt: '2026-08-10T14:00:00Z' },
  { id: 'bw_h3_w48', houseNumber: 'House 3', week: 48, date: '2026-08-17', maleAvgWeightGrams: 4710, femaleAvgWeightGrams: 3925, sampleSize: 90, uniformityPct: 83.0, weeklyGainMale: 20, weeklyGainFemale: 20, loggedBy: 'Eduardo Santos', notes: 'Controlled growth', createdAt: '2026-08-17T11:00:00Z' },

  { id: 'bw_h4_w31', houseNumber: 'House 4', week: 31, date: '2026-08-17', maleAvgWeightGrams: 4260, femaleAvgWeightGrams: 3480, sampleSize: 100, uniformityPct: 89.2, weeklyGainMale: 60, weeklyGainFemale: 55, loggedBy: 'Eduardo Santos', notes: 'Peak production weight optimal', createdAt: '2026-08-17T11:30:00Z' },
  { id: 'bw_h5_w32', houseNumber: 'House 5', week: 32, date: '2026-08-17', maleAvgWeightGrams: 4310, femaleAvgWeightGrams: 3510, sampleSize: 100, uniformityPct: 87.0, weeklyGainMale: 55, weeklyGainFemale: 45, loggedBy: 'Ramon De Jesus', notes: 'Uniformity well within bounds', createdAt: '2026-08-17T13:00:00Z' },
  { id: 'bw_h6_w31', houseNumber: 'House 6', week: 31, date: '2026-08-17', maleAvgWeightGrams: 4270, femaleAvgWeightGrams: 3475, sampleSize: 100, uniformityPct: 88.4, weeklyGainMale: 60, weeklyGainFemale: 50, loggedBy: 'Ramon De Jesus', notes: 'Excellent growth curve', createdAt: '2026-08-17T13:30:00Z' }
];

// Exact figures from the user's prompt for August 16, 2026!
export const INITIAL_EGG_PRODUCTION: EggProductionRecord[] = [
  // HOUSE 1 (Aug 17, 2026)
  {
    id: 'ep_h1_20260817',
    houseNumber: 'House 1',
    date: '2026-08-17',
    heNest: 7800,
    heFloor: 0,
    small: 25,
    broken: 30,
    thinShell: 42,
    doubleYolk: 14,
    misshape: 56,
    others: 10,
    spoiled: 60,
    totalHE: 7800,
    totalNHE: 237,
    tep: 8037,
    loggedBy: 'Marlon Ramos',
    notes: 'Clean nest boxes, optimal production',
    createdAt: '2026-08-17T17:00:00Z'
  },
  // HOUSE 3 (Aug 17, 2026)
  {
    id: 'ep_h3_20260817',
    houseNumber: 'House 3',
    date: '2026-08-17',
    heNest: 6300,
    heFloor: 150,
    small: 15,
    broken: 22,
    thinShell: 81,
    doubleYolk: 16,
    misshape: 61,
    others: 14,
    spoiled: 38,
    totalHE: 6450,
    totalNHE: 247,
    tep: 6697,
    loggedBy: 'Marlon Ramos',
    notes: '150 floor eggs sanitized and separated',
    createdAt: '2026-08-17T17:15:00Z'
  },
  // HOUSE 5 (Aug 17, 2026)
  {
    id: 'ep_h5_20260817',
    houseNumber: 'House 5',
    date: '2026-08-17',
    heNest: 8300,
    heFloor: 0,
    small: 7,
    broken: 54,
    thinShell: 37,
    doubleYolk: 22,
    misshape: 51,
    others: 10,
    spoiled: 69,
    totalHE: 8300,
    totalNHE: 250,
    tep: 8550,
    loggedBy: 'Marlon Ramos',
    notes: 'Zero floor eggs, peak lay rate',
    createdAt: '2026-08-17T17:30:00Z'
  },
  // HOUSE 1 (Aug 16, 2026)
  {
    id: 'ep_h1_20260816',
    houseNumber: 'House 1',
    date: '2026-08-16',
    heNest: 7787,
    heFloor: 0,
    small: 38,
    thinShell: 65,
    misshape: 49,
    doubleYolk: 26,
    broken: 31,
    spoiled: 40,
    others: 14,
    totalHE: 7787,
    totalNHE: 263,
    tep: 8050,
    loggedBy: 'Marlon Ramos',
    notes: 'Zero floor eggs, clean nest boxes',
    createdAt: '2026-08-16T17:00:00Z'
  },
  // HOUSE 2 (Aug 16, 2026)
  {
    id: 'ep_h2_20260816',
    houseNumber: 'House 2',
    date: '2026-08-16',
    heNest: 8230,
    heFloor: 0,
    small: 24,
    thinShell: 27,
    misshape: 50,
    doubleYolk: 26,
    broken: 34,
    spoiled: 62,
    others: 12,
    totalHE: 8230,
    totalNHE: 235,
    tep: 8465,
    loggedBy: 'Marlon Ramos',
    notes: 'High nest egg percentage',
    createdAt: '2026-08-16T17:15:00Z'
  },
  // HOUSE 3 (Aug 16, 2026)
  {
    id: 'ep_h3_20260816',
    houseNumber: 'House 3',
    date: '2026-08-16',
    heNest: 6300,
    heFloor: 150,
    small: 28,
    thinShell: 19,
    misshape: 91,
    doubleYolk: 18,
    broken: 41,
    spoiled: 45,
    others: 11,
    totalHE: 6450,
    totalNHE: 253,
    tep: 6703,
    loggedBy: 'Marlon Ramos',
    notes: '150 floor eggs gathered during noon walk',
    createdAt: '2026-08-16T17:30:00Z'
  },
  // HOUSE 4 (Aug 16, 2026)
  {
    id: 'ep_h4_20260816',
    houseNumber: 'House 4',
    date: '2026-08-16',
    heNest: 8532,
    heFloor: 113,
    small: 6,
    thinShell: 67,
    misshape: 61,
    doubleYolk: 16,
    broken: 41,
    spoiled: 42,
    others: 10,
    totalHE: 8645,
    totalNHE: 243,
    tep: 8888,
    loggedBy: 'Marlon Ramos',
    notes: 'Peak production day high point',
    createdAt: '2026-08-16T17:45:00Z'
  },
  // HOUSE 5 (Aug 16, 2026)
  {
    id: 'ep_h5_20260816',
    houseNumber: 'House 5',
    date: '2026-08-16',
    heNest: 8108,
    heFloor: 0,
    small: 8,
    thinShell: 47,
    misshape: 49,
    doubleYolk: 37,
    broken: 67,
    spoiled: 70,
    others: 10,
    totalHE: 8108,
    totalNHE: 288,
    tep: 8396,
    loggedBy: 'Marlon Ramos',
    notes: 'Good shell quality',
    createdAt: '2026-08-16T18:00:00Z'
  },
  // HOUSE 6 (Aug 16, 2026)
  {
    id: 'ep_h6_20260816',
    houseNumber: 'House 6',
    date: '2026-08-16',
    heNest: 8250,
    heFloor: 100,
    small: 0,
    thinShell: 90,
    misshape: 55,
    doubleYolk: 27,
    broken: 75,
    spoiled: 30,
    others: 4,
    totalHE: 8350,
    totalNHE: 281,
    tep: 8631,
    loggedBy: 'Marlon Ramos',
    notes: 'Late afternoon collection completed',
    createdAt: '2026-08-16T18:15:00Z'
  },

  // Historical day (August 15, 2026) for comparison
  {
    id: 'ep_h1_20260815',
    houseNumber: 'House 1',
    date: '2026-08-15',
    heNest: 7750,
    heFloor: 15,
    small: 42,
    thinShell: 60,
    misshape: 45,
    doubleYolk: 24,
    broken: 28,
    spoiled: 35,
    others: 12,
    totalHE: 7765,
    totalNHE: 246,
    tep: 8011,
    loggedBy: 'Marlon Ramos',
    createdAt: '2026-08-15T17:00:00Z'
  },
  {
    id: 'ep_h2_20260815',
    houseNumber: 'House 2',
    date: '2026-08-15',
    heNest: 8190,
    heFloor: 10,
    small: 28,
    thinShell: 30,
    misshape: 48,
    doubleYolk: 22,
    broken: 30,
    spoiled: 55,
    others: 15,
    totalHE: 8200,
    totalNHE: 228,
    tep: 8428,
    loggedBy: 'Marlon Ramos',
    createdAt: '2026-08-15T17:15:00Z'
  }
];

export const INITIAL_WEEKLY_EGG_WEIGHTS: WeeklyEggWeightRecord[] = [
  { id: 'wew1', houseNumber: 'House 1', date: '2026-08-14', ageInProductionWeeks: 10, weightGrams: 62.4, sampleSize: 150, loggedBy: 'Marlon Ramos', notes: 'Sampled from 3 collection trays per side', createdAt: '2026-08-14T15:00:00Z' },
  { id: 'wew2', houseNumber: 'House 2', date: '2026-08-14', ageInProductionWeeks: 9, weightGrams: 61.8, sampleSize: 150, loggedBy: 'Marlon Ramos', notes: 'High uniformity in egg shape & density', createdAt: '2026-08-14T15:30:00Z' },
  { id: 'wew3', houseNumber: 'House 3', date: '2026-08-14', ageInProductionWeeks: 24, weightGrams: 67.2, sampleSize: 150, loggedBy: 'Marlon Ramos', notes: 'Older flock larger average egg size', createdAt: '2026-08-14T16:00:00Z' },
  { id: 'wew4', houseNumber: 'House 4', date: '2026-08-14', ageInProductionWeeks: 7, weightGrams: 60.5, sampleSize: 150, loggedBy: 'Marlon Ramos', notes: 'Hitting standard weight target', createdAt: '2026-08-14T16:30:00Z' },
  { id: 'wew5', houseNumber: 'House 5', date: '2026-08-14', ageInProductionWeeks: 8, weightGrams: 61.0, sampleSize: 150, loggedBy: 'Marlon Ramos', notes: 'Clean shells', createdAt: '2026-08-14T17:00:00Z' },
  { id: 'wew6', houseNumber: 'House 6', date: '2026-08-14', ageInProductionWeeks: 7, weightGrams: 60.2, sampleSize: 150, loggedBy: 'Marlon Ramos', notes: 'Optimum setting egg weight', createdAt: '2026-08-14T17:30:00Z' }
];

export const INITIAL_SYSTEM_LOGS: SystemLog[] = [
  { id: 'log1', timestamp: '2026-08-16T18:15:30Z', userId: 'usr_egg_collector', userName: 'Marlon Ramos', userRole: 'egg_collector', action: 'LOG_EGG_PRODUCTION', category: 'egg_prod', details: 'Submitted Daily Egg Record for House 6 (TEP: 8631, Nest: 8250, Floor: 100)', houseNumber: 'House 6' },
  { id: 'log2', timestamp: '2026-08-16T17:02:10Z', userId: 'usr_admin', userName: 'Von L.P. Lim (Owner / Admin)', userRole: 'admin', action: 'GENERATE_MESSENGER_REPORT', category: 'egg_prod', details: 'Generated August 16 Daily Egg Production Messenger Report (Grand TEP: 48694)' },
  { id: 'log3', timestamp: '2026-08-16T15:05:00Z', userId: 'usr_leadman', userName: 'Eduardo Santos (Senior Leadman)', userRole: 'leadman', action: 'LOG_DEPLETION', category: 'mortality', details: 'Recorded Missex in House 5 Right side (1 female)', houseNumber: 'House 5' },
  { id: 'log4', timestamp: '2026-08-16T09:48:00Z', userId: 'usr_flockman1', userName: 'Joel Bautista (Flockman H1 & H2)', userRole: 'flockman', action: 'LOG_FEED_CONSUMPTION', category: 'feed', details: 'Logged 1420 kg BLC 1 + 114 kg BMCC for House 1', houseNumber: 'House 1' },
  { id: 'log5', timestamp: '2026-08-16T08:15:00Z', userId: 'usr_manager', userName: 'Ramon De Jesus', userRole: 'farm_manager', action: 'INVENTORY_STOCK_CHECK', category: 'feed', details: 'Low stock notification verified for CSC 2 (3 bags) and PDC (4 bags)' }
];
