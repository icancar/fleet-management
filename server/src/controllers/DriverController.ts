import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { ApiResponse } from '@fleet-management/shared';

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

// Mock driver database
const drivers: Driver[] = [
  {
    id: '1',
    name: 'John Doe',
    licenseNumber: 'DL123456',
    phone: '+1234567890',
    email: 'john.doe@fleet.com',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  }
];

export class DriverController {
  
  getAllDrivers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response: ApiResponse<Driver[]> = {
        success: true,
        data: drivers,
        message: 'Drivers retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  getDriverById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const driver = drivers.find(d => d.id === id);
      
      if (!driver) {
        const error = createError('Driver not found', 404);
        return next(error);
      }
      
      const response: ApiResponse<Driver> = {
        success: true,
        data: driver,
        message: 'Driver retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  createDriver = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, licenseNumber, phone, email } = req.body;
      
      const newDriver: Driver = {
        id: Date.now().toString(),
        name,
        licenseNumber,
        phone,
        email,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      };
      
      drivers.push(newDriver);
      
      const response: ApiResponse<Driver> = {
        success: true,
        data: newDriver,
        message: 'Driver created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  
  updateDriver = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const driverIndex = drivers.findIndex(d => d.id === id);
      
      if (driverIndex === -1) {
        const error = createError('Driver not found', 404);
        return next(error);
      }
      
      const updatedDriver = { ...drivers[driverIndex], ...req.body };
      drivers[driverIndex] = updatedDriver;
      
      const response: ApiResponse<Driver> = {
        success: true,
        data: updatedDriver,
        message: 'Driver updated successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  deleteDriver = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const driverIndex = drivers.findIndex(d => d.id === id);
      
      if (driverIndex === -1) {
        const error = createError('Driver not found', 404);
        return next(error);
      }
      
      drivers.splice(driverIndex, 1);
      
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Driver deleted successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
