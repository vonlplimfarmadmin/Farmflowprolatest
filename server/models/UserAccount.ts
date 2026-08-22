import mongoose, { Schema } from 'mongoose';

export interface IUserAccountDoc {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  designatedHouses?: string[];
  createdAt?: string;
  registeredAt?: string;
  lastLogin?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  contactNumber?: string;
  password?: string;
}

const UserAccountSchema = new Schema<IUserAccountDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    email: { type: String, default: '', index: true },
    role: { type: String, default: 'flockman' },
    status: { type: String, default: 'active' },
    designatedHouses: { type: [String], default: ['House 1', 'House 2'] },
    createdAt: { type: String, default: () => new Date().toISOString() },
    registeredAt: { type: String, default: () => new Date().toISOString().split('T')[0] },
    lastLogin: { type: String },
    securityQuestion: { type: String, default: 'What is your farm station?' },
    securityAnswer: { type: String, default: 'Batangas' },
    contactNumber: { type: String, default: '' },
    password: { type: String, default: 'pass123' },
  },
  { timestamps: true }
);

export const UserAccountModel: mongoose.Model<IUserAccountDoc> =
  (mongoose.models.UserAccount as mongoose.Model<IUserAccountDoc>) ||
  mongoose.model<IUserAccountDoc>('UserAccount', UserAccountSchema);
