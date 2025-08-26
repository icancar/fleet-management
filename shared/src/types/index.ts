// Vehicle types
export interface Vehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  fuelType: FuelType;
  status: VehicleStatus;
  currentMileage: number;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  assignedDriverId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum FuelType {
  GASOLINE = 'gasoline',
  DIESEL = 'diesel',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid',
  PLUGIN_HYBRID = 'plugin_hybrid'
}

export enum VehicleStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service',
  RETIRED = 'retired'
}

// Driver types
export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiryDate: Date;
  status: DriverStatus;
  assignedVehicleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum DriverStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// Trip types
export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  startLocation: Location;
  endLocation: Location;
  startTime: Date;
  endTime?: Date;
  distance?: number;
  fuelConsumption?: number;
  status: TripStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export enum TripStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Maintenance types
export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  description: string;
  cost: number;
  performedBy: string;
  performedAt: Date;
  nextDueDate?: Date;
  mileage: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum MaintenanceType {
  OIL_CHANGE = 'oil_change',
  TIRE_ROTATION = 'tire_rotation',
  BRAKE_SERVICE = 'brake_service',
  ENGINE_TUNE_UP = 'engine_tune_up',
  TRANSMISSION_SERVICE = 'transmission_service',
  OTHER = 'other'
}

// Fuel types
export interface FuelRecord {
  id: string;
  vehicleId: string;
  driverId: string;
  fuelAmount: number;
  fuelCost: number;
  fuelType: FuelType;
  mileage: number;
  location?: Location;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Common types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
