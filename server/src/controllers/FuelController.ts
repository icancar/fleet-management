import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { ApiResponse } from '@fleet-management/shared';

interface FuelRecord {
  id: string;
  vehicleId: string;
  amount: number;
  cost: number;
  date: string;
  fuelType: 'GASOLINE' | 'DIESEL' | 'ELECTRIC';
  station?: string;
}

const fuelRecords: FuelRecord[] = [];

export class FuelController {
  getAllFuelRecords = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response: ApiResponse<FuelRecord[]> = {
        success: true,
        data: fuelRecords,
        message: 'Fuel records retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  getFuelRecordById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const record = fuelRecords.find(f => f.id === id);
      
      if (!record) {
        const error = createError('Fuel record not found', 404);
        return next(error);
      }
      
      const response: ApiResponse<FuelRecord> = {
        success: true,
        data: record,
        message: 'Fuel record retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  createFuelRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newRecord: FuelRecord = {
        id: Date.now().toString(),
        ...req.body,
        fuelType: req.body.fuelType || 'GASOLINE'
      };
      
      fuelRecords.push(newRecord);
      
      const response: ApiResponse<FuelRecord> = {
        success: true,
        data: newRecord,
        message: 'Fuel record created successfully'
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  
  updateFuelRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const recordIndex = fuelRecords.findIndex(f => f.id === id);
      
      if (recordIndex === -1) {
        const error = createError('Fuel record not found', 404);
        return next(error);
      }
      
      const updatedRecord = { ...fuelRecords[recordIndex], ...req.body };
      fuelRecords[recordIndex] = updatedRecord;
      
      const response: ApiResponse<FuelRecord> = {
        success: true,
        data: updatedRecord,
        message: 'Fuel record updated successfully'
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  deleteFuelRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const recordIndex = fuelRecords.findIndex(f => f.id === id);
      
      if (recordIndex === -1) {
        const error = createError('Fuel record not found', 404);
        return next(error);
      }
      
      fuelRecords.splice(recordIndex, 1);
      
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Fuel record deleted successfully'
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
