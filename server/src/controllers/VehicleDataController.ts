import { Request, Response, NextFunction } from 'express';
import { VEHICLE_BRANDS, getVehicleBrands, getVehicleModels } from '@fleet-management/shared';
import { ApiResponse } from '@fleet-management/shared';

export class VehicleDataController {
  
  getVehicleBrands = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brands = getVehicleBrands();
      
      const response: ApiResponse<string[]> = {
        success: true,
        data: brands,
        message: 'Vehicle brands retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getVehicleModels = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { brand } = req.params;
      
      if (!brand) {
        return res.status(400).json({
          success: false,
          message: 'Brand parameter is required'
        });
      }

      const models = getVehicleModels(brand);
      
      const response: ApiResponse<string[]> = {
        success: true,
        data: models,
        message: `Vehicle models for ${brand} retrieved successfully`
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getVehicleData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response: ApiResponse<any> = {
        success: true,
        data: {
          brands: VEHICLE_BRANDS
        },
        message: 'Vehicle data retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
