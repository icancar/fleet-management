import { Request, Response, NextFunction } from 'express';
import { VehicleService } from '../services/VehicleService';
import { createError } from '../middleware/errorHandler';
import { Vehicle, PaginationParams, PaginatedResponse, ApiResponse } from '@fleet-management/shared';

export class VehicleController {
  private vehicleService: VehicleService;

  constructor() {
    this.vehicleService = new VehicleService();
  }

  getAllVehicles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      const paginationParams: PaginationParams = {
        page: Number(page),
        limit: Number(limit),
        sortBy: String(sortBy),
        sortOrder: String(sortOrder) as 'asc' | 'desc'
      };

      const result = await this.vehicleService.getAllVehicles(paginationParams);
      
      const response: ApiResponse<PaginatedResponse<Vehicle>> = {
        success: true,
        data: result
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getVehicleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const vehicle = await this.vehicleService.getVehicleById(id);
      
      if (!vehicle) {
        throw createError('Vehicle not found', 404);
      }

      const response: ApiResponse<Vehicle> = {
        success: true,
        data: vehicle
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  createVehicle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vehicleData = req.body;
      const newVehicle = await this.vehicleService.createVehicle(vehicleData);
      
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
      const updateData = req.body;
      
      const updatedVehicle = await this.vehicleService.updateVehicle(id, updateData);
      
      if (!updatedVehicle) {
        throw createError('Vehicle not found', 404);
      }

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
      const deleted = await this.vehicleService.deleteVehicle(id);
      
      if (!deleted) {
        throw createError('Vehicle not found', 404);
      }

      const response: ApiResponse<null> = {
        success: true,
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
      const { page = 1, limit = 10 } = req.query;
      
      const paginationParams: PaginationParams = {
        page: Number(page),
        limit: Number(limit)
      };

      const maintenance = await this.vehicleService.getVehicleMaintenance(id, paginationParams);
      
      const response: ApiResponse<PaginatedResponse<any>> = {
        success: true,
        data: maintenance
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getVehicleTrips = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const paginationParams: PaginationParams = {
        page: Number(page),
        limit: Number(limit)
      };

      const trips = await this.vehicleService.getVehicleTrips(id, paginationParams);
      
      const response: ApiResponse<PaginatedResponse<any>> = {
        success: true,
        data: trips
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getVehicleFuelRecords = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const paginationParams: PaginationParams = {
        page: Number(page),
        limit: Number(limit)
      };

      const fuelRecords = await this.vehicleService.getVehicleFuelRecords(id, paginationParams);
      
      const response: ApiResponse<PaginatedResponse<any>> = {
        success: true,
        data: fuelRecords
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
