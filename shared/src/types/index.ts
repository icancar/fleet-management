// Core fleet management entities
export interface Vehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  fuelCapacity: number;
  mileage: number;
  status: 'active' | 'maintenance' | 'out_of_service';
  driverId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: Date;
  status: 'active' | 'inactive' | 'suspended';
  vehicleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  startLocation: string;
  endLocation: string;
  startTime: Date;
  endTime?: Date;
  distance?: number;
  fuelUsed?: number;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: 'scheduled' | 'repair' | 'inspection' | 'emergency';
  description: string;
  cost: number;
  date: Date;
  mileage: number;
  nextDueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  date: Date;
  gallons: number;
  cost: number;
  mileage: number;
  fuelType: 'gasoline' | 'diesel' | 'electric';
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  speed?: number;
  bearing?: number;
  altitude?: number;
  createdAt: Date;
}

// NEW: Route visualization types
export interface DailyRoute {
  date: string;
  deviceId: string;
  totalPoints: number;
  totalDistance: number;
  totalDuration: number;
  averageSpeed: number;
  maxSpeed: number;
  startLocation: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  endLocation: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  routePoints: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
    speed?: number;
    accuracy: number;
  }>;
}

export interface RouteStats {
  deviceId: string;
  period: string;
  totalRoutes: number;
  totalDistance: number;
  totalDuration: number;
  totalPoints: number;
  averageSpeed: number;
  maxSpeed: number;
  dailyBreakdown: Array<{
    date: string;
    distance: number;
    duration: number;
    points: number;
  }>;
}

// API and pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Enums
export enum VehicleStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service'
}

export enum DriverStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export enum TripStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum MaintenanceType {
  SCHEDULED = 'scheduled',
  REPAIR = 'repair',
  INSPECTION = 'inspection',
  EMERGENCY = 'emergency'
}

export enum FuelType {
  GASOLINE = 'gasoline',
  DIESEL = 'diesel',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid'
}
