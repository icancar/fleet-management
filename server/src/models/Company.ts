import mongoose, { Document, Schema } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  description?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactInfo?: {
    phone: string;
    email: string;
    website?: string;
  };
  settings?: {
    timezone: string;
    dateFormat: string;
    distanceUnit: 'km' | 'miles';
    currency: string;
  };
  isActive: boolean;
  ownerId: string; // User ID of the company owner
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    dateFormat: {
      type: String,
      default: 'YYYY-MM-DD'
    },
    distanceUnit: {
      type: String,
      enum: ['km', 'miles'],
      default: 'km'
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  ownerId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
CompanySchema.index({ ownerId: 1 });
CompanySchema.index({ isActive: 1 });
CompanySchema.index({ name: 1 });

export const Company = mongoose.model<ICompany>('Company', CompanySchema);
