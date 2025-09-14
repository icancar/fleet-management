import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  DRIVER = 'driver'
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
  managerId?: mongoose.Types.ObjectId; // For managers and drivers - who manages them
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
    required: false
  },
  managerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      // Managers and drivers need a manager (admin for managers, manager for drivers)
      return this.role === UserRole.MANAGER || this.role === UserRole.DRIVER;
    },
    validate: {
      validator: async function(managerId: mongoose.Types.ObjectId) {
        if (!managerId) return true; // Let required handle this
        const manager = await mongoose.model('User').findById(managerId);
        if (!manager) return false;
        
        // If this user is a manager, their manager must be admin
        if (this.role === UserRole.MANAGER) {
          return manager.role === UserRole.ADMIN;
        }
        // If this user is a driver, their manager must be a manager
        if (this.role === UserRole.DRIVER) {
          return manager.role === UserRole.MANAGER;
        }
        return false;
      },
      message: 'Invalid manager assignment: Managers must report to Admin, Drivers must report to Manager'
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
