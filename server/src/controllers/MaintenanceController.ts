import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { ApiResponse } from '@fleet-management/shared';

interface Maintenance {
  id: string;
  vehicleId: string;
  type: 'REPAIR' | 'SERVICE' | 'INSPECTION';
  description: string;
  cost: number;
  date: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

const maintenance: Maintenance[] = [];

export class MaintenanceController {
  getAllMaintenance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response: ApiResponse<Maintenance[]> = {
        success: true,
        data: maintenance,
        message: 'Maintenance records retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  getMaintenanceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const record = maintenance.find(m => m.id === id);
      
      if (!record) {
        const error = createError('Maintenance record not found', 404);
        return next(error);
      }
      
      const response: ApiResponse<Maintenance> = {
        success: true,
        data: record,
        message: 'Maintenance record retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  createMaintenance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newRecord: Maintenance = {
        id: Date.now().toString(),
        ...req.body,
        status: 'PENDING'
      };
      
      maintenance.push(newRecord);
      
      const response: ApiResponse<Maintenance> = {
        success: true,
        data: newRecord,
        message: 'Maintenance record created successfully'
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  
  updateMaintenance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const recordIndex = maintenance.findIndex(m => m.id === id);
      
      if (recordIndex === -1) {
        const error = createError('Maintenance record not found', 404);
        return next(error);
      }
      
      const updatedRecord = { ...maintenance[recordIndex], ...req.body };
      maintenance[recordIndex] = updatedRecord;
      
      const response: ApiResponse<Maintenance> = {
        success: true,
        data: updatedRecord,
        message: 'Maintenance record updated successfully'
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  deleteMaintenance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const recordIndex = maintenance.findIndex(m => m.id === id);
      
      if (recordIndex === -1) {
        const error = createError('Maintenance record not found', 404);
        return next(error);
      }
      
      maintenance.splice(recordIndex, 1);
      
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Maintenance record deleted successfully'
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
