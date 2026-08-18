import mongoose, { Schema } from 'mongoose';

export interface IFlockDoc {
  id: string;
  houseNumber: string;
  breed: string;
  initialBirds: number;
  currentBirds: number;
  hatchDate: string;
  arrivalDate: string;
  targetPeakPercent: number;
  status: 'brooding' | 'rearing' | 'laying' | 'culling';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const FlockSchema = new Schema<IFlockDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    houseNumber: { type: String, required: true, unique: true, index: true },
    breed: { type: String, required: true },
    initialBirds: { type: Number, required: true },
    currentBirds: { type: Number, required: true },
    hatchDate: { type: String, required: true },
    arrivalDate: { type: String, required: true },
    targetPeakPercent: { type: Number, default: 85 },
    status: {
      type: String,
      enum: ['brooding', 'rearing', 'laying', 'culling'],
      default: 'laying',
    },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

export const FlockModel: mongoose.Model<IFlockDoc> =
  (mongoose.models.Flock as mongoose.Model<IFlockDoc>) ||
  mongoose.model<IFlockDoc>('Flock', FlockSchema);

