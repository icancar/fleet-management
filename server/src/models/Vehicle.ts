import mongoose, { Document, Schema } from 'mongoose';
import { VEHICLE_BRANDS, isValidVehicleBrand, isValidVehicleModel } from '@fleet-management/shared';

export interface IVehicle extends Document {
  licensePlate: string;
  make: string;
  vehicleModel: string;
  year: number;
  vin: string;
  nextServiceDate: Date;
  odometer: number;
  status: 'active' | 'maintenance' | 'out_of_service';
  driverId?: mongoose.Types.ObjectId; // Which driver is currently assigned
  companyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>({
  licensePlate: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  make: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return isValidVehicleBrand(v);
      },
      message: 'Make must be a valid vehicle brand'
    }
  },
  vehicleModel: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return isValidVehicleModel(this.make, v);
      },
      message: 'Model must be a valid model for the selected make'
    }
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  vin: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v: string) {
        return /^[A-HJ-NPR-Z0-9]{17}$/.test(v);
      },
      message: 'VIN must be 17 characters long and contain only valid characters'
    }
  },
  nextServiceDate: {
    type: Date,
    required: true
  },
  odometer: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'out_of_service'],
    default: 'active'
  },
  driverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional - vehicle can be unassigned
  },
  companyId: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
VehicleSchema.index({ licensePlate: 1 });
VehicleSchema.index({ vin: 1 });
VehicleSchema.index({ companyId: 1 });
VehicleSchema.index({ driverId: 1 });
VehicleSchema.index({ status: 1 });
VehicleSchema.index({ nextServiceDate: 1 });

// Virtual for full vehicle name
VehicleSchema.virtual('fullName').get(function() {
  return `${this.year} ${this.make} ${this.vehicleModel}`;
});

// Virtual to map vehicleModel to model for frontend compatibility
VehicleSchema.virtual('model').get(function() {
  return this.vehicleModel;
});

// Virtual for dynamic status based on maintenance date
VehicleSchema.virtual('dynamicStatus').get(function() {
  const today = new Date();
  const serviceDate = new Date(this.nextServiceDate);
  const daysUntilService = Math.ceil((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // If service is overdue (negative days), mark as maintenance
  if (daysUntilService < 0) {
    return 'maintenance';
  }
  
  // If service is due within 10 days, mark as maintenance
  if (daysUntilService <= 10) {
    return 'maintenance';
  }
  
  // Otherwise, use the stored status (active or out_of_service)
  return this.status;
});

// Ensure virtual fields are serialized
VehicleSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret: any) {
    return ret;
  }
});

export const Vehicle = mongoose.model<IVehicle>('Vehicle', VehicleSchema);
