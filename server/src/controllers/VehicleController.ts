import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { createError } from '../middleware/errorHandler';
import { ApiResponse } from '@fleet-management/shared';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  fuelType: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  fuelCapacity: number;
  mileage: number;
  lastMaintenance: string;
  driverId?: string;
}

// Mock vehicle database
const vehicles: Vehicle[] = [
  {
    id: '1',
    make: 'Ford',
    model: 'Transit',
    year: 2022,
    licensePlate: 'ABC123',
    vin: '1HGBH41JXMN109186',
    status: 'ACTIVE',
    fuelType: 'GASOLINE',
    fuelCapacity: 80,
    mileage: 15000,
    lastMaintenance: '2024-01-15',
    driverId: '1'
  }
];

export class VehicleController {
  
  getAllVehicles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response: ApiResponse<Vehicle[]> = {
        success: true,
        data: vehicles,
        message: 'Vehicles retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  getVehicleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const vehicle = vehicles.find(v => v.id === id);
      
      if (!vehicle) {
        const error = createError('Vehicle not found', 404);
        return next(error);
      }
      
      const response: ApiResponse<Vehicle> = {
        success: true,
        data: vehicle,
        message: 'Vehicle retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  createVehicle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newVehicle: Vehicle = {
        id: Date.now().toString(),
        ...req.body,
        status: 'ACTIVE',
        mileage: req.body.mileage || 0
      };
      
      vehicles.push(newVehicle);
      
      const response: ApiResponse<Vehicle> = {
        success: true,
        data: newVehicle,
        message: 'Vehicle created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  
  updateVehicle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const vehicleIndex = vehicles.findIndex(v => v.id === id);
      
      if (vehicleIndex === -1) {
        const error = createError('Vehicle not found', 404);
        return next(error);
      }
      
      const updatedVehicle = { ...vehicles[vehicleIndex], ...req.body };
      vehicles[vehicleIndex] = updatedVehicle;
      
      const response: ApiResponse<Vehicle> = {
        success: true,
        data: updatedVehicle,
        message: 'Vehicle updated successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  deleteVehicle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const vehicleIndex = vehicles.findIndex(v => v.id === id);
      
      if (vehicleIndex === -1) {
        const error = createError('Vehicle not found', 404);
        return next(error);
      }
      
      vehicles.splice(vehicleIndex, 1);
      
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Vehicle deleted successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  getVehicleMaintenance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const vehicle = vehicles.find(v => v.id === id);
      
      if (!vehicle) {
        const error = createError('Vehicle not found', 404);
        return next(error);
      }
      
      // Mock maintenance data
      const maintenance = [
        {
          id: '1',
          type: 'OIL_CHANGE',
          description: 'Regular oil change',
          date: '2024-01-15',
          cost: 45.00
        }
      ];
      
      const response: ApiResponse<any> = {
        success: true,
        data: maintenance,
        message: 'Vehicle maintenance history retrieved'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  getVehicleTrips = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const vehicle = vehicles.find(v => v.id === id);
      
      if (!vehicle) {
        const error = createError('Vehicle not found', 404);
        return next(error);
      }
      
      // Mock trip data
      const trips = [
        {
          id: '1',
          startLocation: 'NYC',
          endLocation: 'Boston',
          startTime: '2024-01-20T08:00:00Z',
          status: 'COMPLETED'
        }
      ];
      
      const response: ApiResponse<any> = {
        success: true,
        data: trips,
        message: 'Vehicle trip history retrieved'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  getVehicleFuelRecords = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const vehicle = vehicles.find(v => v.id === id);
      
      if (!vehicle) {
        const error = createError('Vehicle not found', 404);
        return next(error);
      }
      
      // Mock fuel data
      const fuelRecords = [
        {
          id: '1',
          amount: 45.5,
          cost: 68.25,
          date: '2024-01-19',
          fuelType: 'GASOLINE'
        }
      ];
      
      const response: ApiResponse<any> = {
        success: true,
        data: fuelRecords,
        message: 'Vehicle fuel records retrieved'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
