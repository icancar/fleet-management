import { Request, Response, NextFunction } from 'express';
import { LocationService } from '../services/LocationService';
import { LocationDatabaseService } from '../services/LocationDatabaseService';
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

      // Save to MongoDB
      const savedLocation = await LocationDatabaseService.saveLocationData(locationData);
      
      const response: ApiResponse<any> = {
        success: true,
        data: savedLocation,
        message: 'Location received and saved to MongoDB successfully'
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

  // New method: Get daily routes for a specific device
  getDeviceDailyRoutes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { deviceId } = req.params;
      const { date } = req.query;
      
      const routes = await LocationDatabaseService.getDeviceDailyRoutes(deviceId, date as string);
      
      const response: ApiResponse<any> = {
        success: true,
        data: routes,
        message: `Daily routes for device ${deviceId}`
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // New method: Get all daily routes for all devices
  getAllDailyRoutes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date } = req.query;
      
      const routes = await this.locationService.getAllDailyRoutes(date as string);
      
      const response: ApiResponse<any> = {
        success: true,
        data: routes,
        message: 'All daily routes'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // New method: Get route statistics for a device
  getDeviceRouteStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { deviceId } = req.params;
      const { days = 7 } = req.query;
      
      const numDays = Number(days);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - numDays);
      
      const routes = await this.locationService.getDeviceDailyRoutes(deviceId);
      const recentRoutes = routes.filter(route => {
        const routeDate = new Date(route.date);
        return routeDate >= startDate && routeDate <= endDate;
      });
      
      // Calculate statistics
      const totalDistance = recentRoutes.reduce((sum, route) => sum + route.totalDistance, 0);
      const totalDuration = recentRoutes.reduce((sum, route) => sum + route.totalDuration, 0);
      const totalPoints = recentRoutes.reduce((sum, route) => sum + route.totalPoints, 0);
      const averageSpeed = recentRoutes.length > 0 
        ? recentRoutes.reduce((sum, route) => sum + route.averageSpeed, 0) / recentRoutes.length 
        : 0;
      const maxSpeed = recentRoutes.length > 0 
        ? Math.max(...recentRoutes.map(route => route.maxSpeed)) 
        : 0;
      
      const stats = {
        deviceId,
        period: `${numDays} days`,
        totalRoutes: recentRoutes.length,
        totalDistance,
        totalDuration,
        totalPoints,
        averageSpeed,
        maxSpeed,
        dailyBreakdown: recentRoutes.map(route => ({
          date: route.date,
          distance: route.totalDistance,
          duration: route.totalDuration,
          points: route.totalPoints
        }))
      };
      
      const response: ApiResponse<any> = {
        success: true,
        data: stats,
        message: `Route statistics for device ${deviceId}`
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // New method: Get all devices
  getAllDevices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const devices = await LocationDatabaseService.getAllDevices();
      
      const response: ApiResponse<any> = {
        success: true,
        data: devices,
        message: 'All devices retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // New method: Get device statistics
  getDeviceStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { deviceId } = req.params;
      
      const stats = await LocationDatabaseService.getDeviceStats(deviceId);
      
      if (!stats) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }
      
      const response: ApiResponse<any> = {
        success: true,
        data: stats,
        message: `Device statistics for ${deviceId}`
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
