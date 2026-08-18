import mongoose, { Schema } from 'mongoose';

export interface IEggRecordDoc {
  id: string;
  houseNumber: string;
  date: string;
  heNest: number;
  heFloor: number;
  small: number;
  broken: number;
  thinShell: number;
  doubleYolk: number;
  misshape: number;
  others: number;
  spoiled: number;
  totalHE: number;
  totalNHE: number;
  tep: number;
  sampleEggWeightGrams?: number;
  notes?: string;
  loggedBy?: string;
  collections?: any;
  sorting?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

const EggRecordSchema = new Schema<IEggRecordDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    houseNumber: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    heNest: { type: Number, default: 0 },
    heFloor: { type: Number, default: 0 },
    small: { type: Number, default: 0 },
    broken: { type: Number, default: 0 },
    thinShell: { type: Number, default: 0 },
    doubleYolk: { type: Number, default: 0 },
    misshape: { type: Number, default: 0 },
    others: { type: Number, default: 0 },
    spoiled: { type: Number, default: 0 },
    totalHE: { type: Number, default: 0 },
    totalNHE: { type: Number, default: 0 },
    tep: { type: Number, default: 0 },
    sampleEggWeightGrams: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    loggedBy: { type: String, default: 'Staff' },
    collections: { type: Schema.Types.Mixed, default: {} },
    sorting: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

export const EggRecordModel: mongoose.Model<IEggRecordDoc> =
  (mongoose.models.EggRecord as mongoose.Model<IEggRecordDoc>) ||
  mongoose.model<IEggRecordDoc>('EggRecord', EggRecordSchema);

