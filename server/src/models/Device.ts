import mongoose, { Document, Schema } from 'mongoose';

export interface IDevice extends Document {
  deviceId: string;
  deviceFingerprint: string;
  manufacturer?: string;
  deviceModel?: string;
  androidVersion?: string;
  imei?: string;
  userId?: string; // Link device to a user (driver)
  companyId?: string; // Link device to a company
  firstSeen: Date;
  lastSeen: Date;
  totalLocations: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  deviceFingerprint: {
    type: String,
    required: true
  },
  manufacturer: {
    type: String
  },
  deviceModel: {
    type: String
  },
  androidVersion: {
    type: String
  },
  imei: {
    type: String
  },
  userId: {
    type: String,
    ref: 'User'
  },
  companyId: {
    type: String,
    ref: 'Company'
  },
  firstSeen: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  totalLocations: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
DeviceSchema.index({ deviceId: 1 });
DeviceSchema.index({ userId: 1 });
DeviceSchema.index({ companyId: 1 });
DeviceSchema.index({ lastSeen: -1 });
DeviceSchema.index({ isActive: 1 });

export const Device = mongoose.model<IDevice>('Device', DeviceSchema);
