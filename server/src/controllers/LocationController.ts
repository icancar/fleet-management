import { Request, Response, NextFunction } from 'express';
import { LocationService } from '../services/LocationService';
import { createError } from '../middleware/errorHandler';
import { ApiResponse } from '@fleet-management/shared';

export class LocationController {
  private locationService: LocationService;

  constructor() {
    this.locationService = new LocationService();
  }

  receiveLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const locationData = req.body;
      
      // Log location data to terminal (as requested)
      console.log('\n📍 LOCATION UPDATE RECEIVED:');
      console.log(`   Device: ${locationData.deviceId}`);
      console.log(`   Coordinates: ${locationData.latitude}, ${locationData.longitude}`);
      console.log(`   Accuracy: ${locationData.accuracy}m`);
      console.log(`   Speed: ${locationData.speed || 'N/A'} m/s`);
      console.log(`   Bearing: ${locationData.bearing || 'N/A'}°`);
      console.log(`   Altitude: ${locationData.altitude || 'N/A'}m`);
      console.log(`   Timestamp: ${new Date(locationData.timestamp).toLocaleString()}`);
      console.log('   ──────────────────────────────────────────\n');

      // Save to database
      const savedLocation = await this.locationService.saveLocation(locationData);
      
      const response: ApiResponse<any> = {
        success: true,
        data: savedLocation,
        message: 'Location received successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getLocationHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      
      const paginationParams = {
        page: Number(page),
        limit: Number(limit)
      };

      const locations = await this.locationService.getLocationHistory(paginationParams);
      
      const response: ApiResponse<any> = {
        success: true,
        data: locations
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getDeviceLocationHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { deviceId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      
      const paginationParams = {
        page: Number(page),
        limit: Number(limit)
      };

      const locations = await this.locationService.getDeviceLocationHistory(deviceId, paginationParams);
      
      const response: ApiResponse<any> = {
        success: true,
        data: locations
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
