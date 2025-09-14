import mongoose, { Document, Schema } from 'mongoose';

export interface ILocationLog extends Document {
  deviceId: string;
  userId?: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  speed: number;
  bearing: number;
  altitude: number;
  createdAt: Date;
  updatedAt: Date;
}

const LocationLogSchema = new Schema<ILocationLog>({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: false,
    index: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  accuracy: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  speed: {
    type: Number,
    required: false
  },
  bearing: {
    type: Number,
    required: false
  },
  altitude: {
    type: Number,
    required: false
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
LocationLogSchema.index({ deviceId: 1, timestamp: -1 });
LocationLogSchema.index({ deviceId: 1, createdAt: -1 });
LocationLogSchema.index({ userId: 1, timestamp: -1 });

export const LocationLog = mongoose.model<ILocationLog>('LocationLog', LocationLogSchema);
