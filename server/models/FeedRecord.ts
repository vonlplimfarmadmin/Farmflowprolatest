import mongoose, { Schema } from 'mongoose';

export interface IFeedRecordDoc {
  id: string;
  date: string;
  houseNumber: string;
  feedType: string;
  amountKg: number;
  gramsPerBird: number;
  recordedBy: string;
  costPerKg?: number;
  totalCost?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const FeedRecordSchema = new Schema<IFeedRecordDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    date: { type: String, required: true, index: true },
    houseNumber: { type: String, required: true, index: true },
    feedType: { type: String, required: true },
    amountKg: { type: Number, required: true },
    gramsPerBird: { type: Number, default: 0 },
    recordedBy: { type: String, default: 'Staff' },
    costPerKg: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const FeedRecordModel: mongoose.Model<IFeedRecordDoc> =
  (mongoose.models.FeedRecord as mongoose.Model<IFeedRecordDoc>) ||
  mongoose.model<IFeedRecordDoc>('FeedRecord', FeedRecordSchema);

