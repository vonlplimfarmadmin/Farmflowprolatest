import mongoose, { Schema } from 'mongoose';

// 1. Mortality & Depletion Model
export interface IDepletionDoc {
  id: string;
  houseNumber: string;
  date: string;
  maleMortality: number;
  femaleMortality: number;
  maleCulls: number;
  femaleCulls: number;
  reason?: string;
  loggedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const DepletionSchema = new Schema<IDepletionDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    houseNumber: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    maleMortality: { type: Number, default: 0 },
    femaleMortality: { type: Number, default: 0 },
    maleCulls: { type: Number, default: 0 },
    femaleCulls: { type: Number, default: 0 },
    reason: { type: String, default: '' },
    loggedBy: { type: String, default: 'Staff' },
  },
  { timestamps: true }
);

export const DepletionModel: mongoose.Model<IDepletionDoc> =
  (mongoose.models.Depletion as mongoose.Model<IDepletionDoc>) ||
  mongoose.model<IDepletionDoc>('Depletion', DepletionSchema);

// 2. Medication Administration Model
export interface IMedAdminDoc {
  id: string;
  date: string;
  houseNumber: string;
  productId: string;
  productName: string;
  unitsUsed: number;
  unit: string;
  method: string;
  reason: string;
  cost?: number;
  loggedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MedAdminSchema = new Schema<IMedAdminDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    date: { type: String, required: true, index: true },
    houseNumber: { type: String, required: true, index: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    unitsUsed: { type: Number, required: true },
    unit: { type: String, default: 'bottles' },
    method: { type: String, default: 'Drinking Water' },
    reason: { type: String, default: '' },
    cost: { type: Number, default: 0 },
    loggedBy: { type: String, default: 'Staff' },
  },
  { timestamps: true }
);

export const MedAdminModel: mongoose.Model<IMedAdminDoc> =
  (mongoose.models.MedAdmin as mongoose.Model<IMedAdminDoc>) ||
  mongoose.model<IMedAdminDoc>('MedAdmin', MedAdminSchema);

// 3. Body Weight Model
export interface IBodyWeightDoc {
  id: string;
  houseNumber: string;
  date: string;
  week: number;
  maleAvgWeightGrams: number;
  femaleAvgWeightGrams: number;
  maleUniformityPct?: number;
  femaleUniformityPct?: number;
  weeklyGainMale?: number;
  weeklyGainFemale?: number;
  loggedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const BodyWeightSchema = new Schema<IBodyWeightDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    houseNumber: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    week: { type: Number, required: true },
    maleAvgWeightGrams: { type: Number, default: 0 },
    femaleAvgWeightGrams: { type: Number, default: 0 },
    maleUniformityPct: { type: Number, default: 85 },
    femaleUniformityPct: { type: Number, default: 85 },
    weeklyGainMale: { type: Number, default: 0 },
    weeklyGainFemale: { type: Number, default: 0 },
    loggedBy: { type: String, default: 'Staff' },
  },
  { timestamps: true }
);

export const BodyWeightModel: mongoose.Model<IBodyWeightDoc> =
  (mongoose.models.BodyWeight as mongoose.Model<IBodyWeightDoc>) ||
  mongoose.model<IBodyWeightDoc>('BodyWeight', BodyWeightSchema);

// 4. Biosecurity Verification Log Model
export interface IBiosecurityLogDoc {
  id: string;
  requirementId: string;
  date: string;
  status: string;
  notes?: string;
  correctiveAction?: string;
  verifiedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const BiosecurityLogSchema = new Schema<IBiosecurityLogDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    requirementId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    status: { type: String, default: 'passed' },
    notes: { type: String, default: '' },
    correctiveAction: { type: String, default: '' },
    verifiedBy: { type: String, default: 'Staff' },
  },
  { timestamps: true }
);

export const BiosecurityLogModel: mongoose.Model<IBiosecurityLogDoc> =
  (mongoose.models.BiosecurityLog as mongoose.Model<IBiosecurityLogDoc>) ||
  mongoose.model<IBiosecurityLogDoc>('BiosecurityLog', BiosecurityLogSchema);
