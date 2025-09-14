import { Request, Response, NextFunction } from 'express';
import { LocationDatabaseService } from '../services/LocationDatabaseService';
import { OdometerService } from '../services/OdometerService';
import { createError } from '../middleware/errorHandler';
import { ApiResponse } from '@fleet-management/shared';
import { UserRole } from '../models/User';
import { Device } from '../models/Device';
import { broadcastLocationUpdate } from '../routes/locationEvents';

export class LocationController {

  receiveLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const locationData = req.body;
      
      // Log location data to terminal (as requested)
      console.log('\n📍 LOCATION UPDATE RECEIVED:');
      console.log(`   Device: ${locationData.deviceId}`);
      console.log(`   User ID: ${locationData.userId || 'Anonymous'}`);
      console.log(`   Coordinates: ${locationData.latitude}, ${locationData.longitude}`);
      console.log(`   Accuracy: ${locationData.accuracy}m`);
      console.log(`   Speed: ${locationData.speed || 'N/A'} m/s`);
      console.log(`   Bearing: ${locationData.bearing || 'N/A'}°`);
      console.log(`   Altitude: ${locationData.altitude || 'N/A'}m`);
      console.log(`   Timestamp: ${new Date(locationData.timestamp).toLocaleString()}`);
      console.log('   ──────────────────────────────────────────\n');

      // Save to MongoDB
      const savedLocation = await LocationDatabaseService.saveLocationData(locationData);
      
      // Update vehicle odometer if user is assigned to a vehicle
      if (locationData.userId) {
        await OdometerService.updateOdometer(
          locationData.deviceId,
          locationData.userId,
          {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            timestamp: locationData.timestamp
          }
        );
      }
      
      // Broadcast location update to connected clients
      if (locationData.userId) {
        broadcastLocationUpdate(locationData.userId, {
          deviceId: locationData.deviceId,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          timestamp: locationData.timestamp,
          accuracy: locationData.accuracy,
          speed: locationData.speed,
          bearing: locationData.bearing,
          altitude: locationData.altitude
        });
      }
      
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
      // This method is not implemented in LocationDatabaseService yet
      // For now, return empty data
      const response: ApiResponse<any> = {
        success: true,
        data: [],
        message: 'Location history not implemented yet'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getDeviceLocationHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // This method is not implemented in LocationDatabaseService yet
      // For now, return empty data
      const response: ApiResponse<any> = {
        success: true,
        data: [],
        message: 'Device location history not implemented yet'
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
      
      // Get all devices first, then get routes for each
      const devices = await LocationDatabaseService.getAllDevices();
      const allRoutes = [];
      
      for (const device of devices) {
        const deviceRoutes = await LocationDatabaseService.getDeviceDailyRoutes(device.deviceId, date as string);
        allRoutes.push(...deviceRoutes);
      }
      
      const routes = allRoutes;
      
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
      
      const routes = await LocationDatabaseService.getDeviceDailyRoutes(deviceId);
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

  // New method: Get location data with user-based access control
  getLocationDataWithAccessControl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;
      const { deviceId, date } = req.query;

      let allowedDeviceIds: string[] = [];

      // Determine which devices the user can access
      switch (currentUser.role) {
        case UserRole.ADMIN:
          // Company owner can see all devices in their company
          const companyDevices = await Device.find({ 
            companyId: currentUser.companyId,
            isActive: true 
          });
          allowedDeviceIds = companyDevices.map(device => device.deviceId);
          break;

        case UserRole.MANAGER:
          // Manager can see devices of their assigned drivers
          const managerDevices = await Device.find({ 
            userId: { $in: await this.getManagedUserIds(currentUser._id) },
            isActive: true 
          });
          allowedDeviceIds = managerDevices.map(device => device.deviceId);
          break;

        case UserRole.DRIVER:
          // Driver can only see their own devices
          const driverDevices = await Device.find({ 
            userId: currentUser._id,
            isActive: true 
          });
          allowedDeviceIds = driverDevices.map(device => device.deviceId);
          break;
      }

      // If specific deviceId is requested, check if user has access
      if (deviceId && !allowedDeviceIds.includes(deviceId as string)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this device'
        });
      }

      // Get location data for all devices (not just the first one)
      if (allowedDeviceIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'No accessible devices found'
        });
      }

      // If specific deviceId is requested, get routes for that device only
      if (deviceId) {
        const routes = await LocationDatabaseService.getDeviceDailyRoutes(deviceId as string, date as string);
        
        const response: ApiResponse<any> = {
          success: true,
          data: routes,
          message: `Location data for device ${deviceId}`
        };
        
        return res.json(response);
      }

      // Otherwise, get routes for all devices (like admin page does)
      const allRoutes = [];
      for (const deviceId of allowedDeviceIds) {
        const deviceRoutes = await LocationDatabaseService.getDeviceDailyRoutes(deviceId, date as string);
        console.log(`🔍 Driver routes for device ${deviceId}:`, deviceRoutes.length, 'routes');
        allRoutes.push(...deviceRoutes);
      }
      
      console.log(`🔍 Driver total routes:`, allRoutes.length);
      console.log(`🔍 Driver routes data:`, allRoutes.map(r => ({
        deviceId: r.deviceId,
        totalDistance: r.totalDistance,
        totalDuration: r.totalDuration,
        totalPoints: r.totalPoints,
        averageSpeed: r.averageSpeed,
        maxSpeed: r.maxSpeed
      })));
      
      const response: ApiResponse<any> = {
        success: true,
        data: allRoutes,
        message: `Location data for ${allowedDeviceIds.length} device(s)`
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // Helper method to get managed user IDs for a manager
  private async getManagedUserIds(managerId: string): Promise<string[]> {
    const { User } = await import('../models/User');
    const managedUsers = await User.find({ 
      managerId,
      isActive: true 
    });
    return managedUsers.map(user => (user._id as any).toString());
  };

  // New method: Get current odometer reading for a user's vehicle
  getCurrentOdometer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;
      
      const odometerReading = await OdometerService.getOdometerForUser(currentUser._id);
      
      if (odometerReading === null) {
        return res.status(404).json({
          success: false,
          message: 'No vehicle assigned to user'
        });
      }

      const response: ApiResponse<any> = {
        success: true,
        data: { odometer: odometerReading },
        message: 'Current odometer reading retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // New method: Set odometer reading (for maintenance/corrections)
  setOdometer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;
      const { vehicleId, newReading } = req.body;

      // Check if user has permission to update this vehicle
      if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MANAGER) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update odometer'
        });
      }

      const success = await OdometerService.setOdometer(vehicleId, newReading);
      
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update odometer reading'
        });
      }

      const response: ApiResponse<any> = {
        success: true,
        data: { odometer: newReading },
        message: 'Odometer reading updated successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
