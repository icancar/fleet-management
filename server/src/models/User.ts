import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  DRIVER = 'driver',
  MANAGER = 'manager',
  COMPANY_OWNER = 'company_owner'
}

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  avatar?: string;
  companyId?: string;
  managerId?: string; // For drivers - which manager manages them
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    required: true,
    default: UserRole.DRIVER
  },
  isActive: {
    type: Boolean,
    default: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String
  },
  companyId: {
    type: String,
    required: true
  },
  managerId: {
    type: String,
    required: function() {
      return this.role === UserRole.DRIVER;
    }
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
UserSchema.index({ email: 1 });
UserSchema.index({ companyId: 1, role: 1 });
UserSchema.index({ managerId: 1 });
UserSchema.index({ isActive: 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret: any) {
    if (ret.password) {
      delete ret.password;
    }
    return ret;
  }
});

export const User = mongoose.model<IUser>('User', UserSchema);
