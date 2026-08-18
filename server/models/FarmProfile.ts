import mongoose, { Schema } from 'mongoose';

export interface IFarmProfileDoc {
  id: string;
  name: string;
  location: string;
  owner: string;
  contactEmail: string;
  contactPhone: string;
  flockCapacity: number;
  housesCount: number;
  establishedDate: string;
  logoUrl?: string;
  updatedAt?: Date;
}

const FarmProfileSchema = new Schema<IFarmProfileDoc>(
  {
    id: { type: String, default: 'farm_profile_main', unique: true },
    name: { type: String, default: 'L.P. LIM CITY FAMILY FARM INC' },
    location: { type: String, default: 'Barangay San Isidro, Lipa City, Batangas' },
    owner: { type: String, default: 'Lim Family Poultry Operations' },
    contactEmail: { type: String, default: 'operations@lplimfamilyfarm.com' },
    contactPhone: { type: String, default: '+63 917 889 1234' },
    flockCapacity: { type: Number, default: 35000 },
    housesCount: { type: Number, default: 3 },
    establishedDate: { type: String, default: '2020-03-15' },
    logoUrl: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

export const FarmProfileModel: mongoose.Model<IFarmProfileDoc> =
  (mongoose.models.FarmProfile as mongoose.Model<IFarmProfileDoc>) ||
  mongoose.model<IFarmProfileDoc>('FarmProfile', FarmProfileSchema);

