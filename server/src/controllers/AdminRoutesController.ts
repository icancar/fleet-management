import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '../models/User';
import { Vehicle } from '../models/Vehicle';
import { Device } from '../models/Device';
import { LocationDatabaseService } from '../services/LocationDatabaseService';
import { ApiResponse } from '@fleet-management/shared';

export class AdminRoutesController {

  // Get all drivers with their route summary for a specific date
  getDriversSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date } = req.query;
      const targetDate = date as string || new Date().toISOString().split('T')[0];
      const currentUser = (req as any).user;

      // Get drivers based on user role
      let drivers;
      if (currentUser.role === UserRole.DRIVER) {
        // Drivers can only see themselves
        drivers = await User.find({ 
          _id: currentUser._id,
          role: UserRole.DRIVER,
          isActive: true 
        });
      } else {
        // Admins and managers can see all drivers
        drivers = await User.find({ 
          role: UserRole.DRIVER,
          isActive: true 
        });
      }

      const driversWithRoutes = [];

      for (const driver of drivers) {
        // Get route summary for this driver for the specified date
        const routes = await LocationDatabaseService.getDriverRoutesForDate((driver._id as any).toString(), targetDate);
        
        // Get vehicle information for this driver
        const vehicle = await Vehicle.findOne({ driverId: driver._id });
        
        const totalDistance = routes.reduce((sum, route) => sum + route.totalDistance, 0);
        const totalDuration = routes.reduce((sum, route) => sum + route.totalDuration, 0);
        const totalPoints = routes.reduce((sum, route) => sum + route.totalPoints, 0);

        driversWithRoutes.push({
          _id: driver._id,
          firstName: driver.firstName,
          lastName: driver.lastName,
          email: driver.email,
          phone: driver.phone,
          vehicle: vehicle ? {
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            licensePlate: vehicle.licensePlate
          } : null,
          routes: routes,
          summary: {
            totalDistance,
            totalDuration,
            totalPoints,
            routeCount: routes.length
          }
        });
      }

      const response: ApiResponse<any> = {
        success: true,
        data: driversWithRoutes,
        message: `Drivers summary for ${targetDate}`
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get detailed route data for a specific driver
  getDriverRoutes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { driverId } = req.params;
      const { date } = req.query;
      const targetDate = date as string || new Date().toISOString().split('T')[0];
      const currentUser = (req as any).user;

      // console.log(`🔍 AdminRoutes getDriverRoutes called:`, {
      //   driverId,
      //   currentUserId: currentUser?._id,
      //   currentUserRole: currentUser?.role,
      //   UserRoleDRIVER: UserRole.DRIVER,
      //   roleComparison: currentUser?.role === UserRole.DRIVER,
      //   targetDate
      // });

      // Check permissions: drivers can only access their own data, admins can access any driver
      if (currentUser.role === UserRole.DRIVER && currentUser._id.toString() !== driverId) {
        console.log(`🔍 Access denied for driver ${currentUser._id} trying to access ${driverId}`);
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own routes.'
        });
      }

      // Verify the driver exists and is active
      const driver = await User.findOne({ 
        _id: driverId, 
        role: UserRole.DRIVER,
        isActive: true 
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }

      // Get vehicle information for this driver
      const vehicle = await Vehicle.findOne({ driverId: driverId });

      // Get detailed route data for this driver (including routePoints for map display)
      const routes = await LocationDatabaseService.getDriverRoutesForDate(driverId, targetDate);
      
      // Get the actual route points for map display
      const devices = await Device.find({ userId: driverId, isActive: true });
      const routesWithPoints = [];
      
      for (const device of devices) {
        const deviceRoutes = await LocationDatabaseService.getDeviceDailyRoutes(device.deviceId, targetDate);
        routesWithPoints.push(...deviceRoutes);
      }

      console.log(`🔍 Admin routes for driver ${driverId}:`, routes.length, 'routes');
      console.log(`🔍 Admin routes data:`, routes.map(r => ({
        deviceId: r.deviceId,
        totalDistance: r.totalDistance,
        totalDuration: r.totalDuration,
        totalPoints: r.totalPoints,
        averageSpeed: r.averageSpeed,
        maxSpeed: r.maxSpeed
      })));

      const response: ApiResponse<any> = {
        success: true,
        data: {
          driver: {
            _id: driver._id,
            firstName: driver.firstName,
            lastName: driver.lastName,
            email: driver.email,
            phone: driver.phone,
            vehicle: vehicle ? {
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              licensePlate: vehicle.licensePlate
            } : null
        },
        routes: routesWithPoints,
        date: targetDate
        },
        message: `Route data for ${driver.firstName} ${driver.lastName} on ${targetDate}`
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
