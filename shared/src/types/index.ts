// User and authentication types
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  DRIVER = 'driver'
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  avatar?: string;
  companyId?: string;
  managerId?: string; // ObjectId as string when serialized
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  fullName?: string;
}

// Core fleet management entities
export interface Vehicle {
  _id: string;
  licensePlate: string;
  make: string;
  model: string; // Keep as 'model' for frontend compatibility
  year: number;
  vin: string;
  nextServiceDate: Date;
  odometer: number;
  status: 'active' | 'maintenance' | 'out_of_service';
  driverId?: string | { _id: string; firstName: string; lastName: string; email: string };
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  fullName?: string;
  daysUntilService?: number; // Calculated field for dynamic status
}

// Simplified interfaces for core functionality

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
