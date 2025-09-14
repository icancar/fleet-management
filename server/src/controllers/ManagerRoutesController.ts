import { Request, Response } from 'express';
import { User, UserRole } from '../models/User';
import { LocationLog } from '../models/LocationLog';
import { Vehicle } from '../models/Vehicle';

export class ManagerRoutesController {
  // Get all drivers managed by the current manager
  async getManagedDrivers(req: Request, res: Response) {
    try {
      const managerId = (req as any).user._id;
      
      // Verify the user is a manager
      const manager = await User.findById(managerId);
      if (!manager || manager.role !== UserRole.MANAGER) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only managers can view managed drivers.'
        });
      }

      // Get all drivers managed by this manager
      const drivers = await User.find({
        managerId: managerId,
        role: UserRole.DRIVER,
        isActive: true
      }).select('-password').sort({ firstName: 1, lastName: 1 });

      res.json({
        success: true,
        data: drivers,
        message: `Found ${drivers.length} managed drivers`
      });
    } catch (error) {
      console.error('Error fetching managed drivers:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching managed drivers'
      });
    }
  }

  // Get routes for a specific driver (by driver ID)
  async getDriverRoutes(req: Request, res: Response) {
    try {
      const managerId = (req as any).user._id;
      const { driverId } = req.params;
      const { date } = req.query;

      // Verify the user is a manager
      const manager = await User.findById(managerId);
      if (!manager || manager.role !== UserRole.MANAGER) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only managers can view driver routes.'
        });
      }

      // Verify the driver is managed by this manager
      const driver = await User.findOne({
        _id: driverId,
        managerId: managerId,
        role: UserRole.DRIVER,
        isActive: true
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found or not managed by you'
        });
      }

      // Get the driver's vehicle
      const vehicle = await Vehicle.findOne({ driverId: driverId });
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'No vehicle assigned to this driver'
        });
      }

      // Parse date or use today
      const targetDate = date ? new Date(date as string) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get location logs for the specified date
      const locationLogs = await LocationLog.find({
        userId: driverId,
        timestamp: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).sort({ timestamp: 1 });

      // Group logs by device and create route points
      const deviceRoutes = new Map<string, any[]>();

      locationLogs.forEach(log => {
        if (!deviceRoutes.has(log.deviceId)) {
          deviceRoutes.set(log.deviceId, []);
        }
        deviceRoutes.get(log.deviceId)!.push({
          latitude: log.latitude,
          longitude: log.longitude,
          timestamp: log.timestamp,
          accuracy: log.accuracy,
          speed: log.speed,
          bearing: log.bearing,
          altitude: log.altitude
        });
      });

      // Convert to array format with calculated statistics
      const routes = Array.from(deviceRoutes.entries()).map(([deviceId, routePoints]) => {
        // Calculate statistics using the same method as LocationDatabaseService
        const totalDistance = ManagerRoutesController.calculateTotalDistance(routePoints);
        const totalDuration = ManagerRoutesController.calculateTotalDuration(routePoints);
        const averageSpeed = ManagerRoutesController.calculateAverageSpeed(routePoints);
        const maxSpeed = Math.max(...routePoints.map(p => p.speed || 0));

        return {
          deviceId,
          driverId,
          driverName: `${driver.firstName} ${driver.lastName}`,
          vehicleInfo: {
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            licensePlate: vehicle.licensePlate
          },
          routePoints,
          totalPoints: routePoints.length,
          totalDistance,
          totalDuration,
          averageSpeed,
          maxSpeed,
          date: targetDate.toISOString().split('T')[0],
          startTime: routePoints.length > 0 ? routePoints[0].timestamp : null,
          endTime: routePoints.length > 0 ? routePoints[routePoints.length - 1].timestamp : null
        };
      });

      res.json({
        success: true,
        data: routes,
        message: `Found ${routes.length} route(s) for driver ${driver.firstName} ${driver.lastName}`
      });
    } catch (error) {
      console.error('Error fetching driver routes:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching driver routes'
      });
    }
  }

  // Get all drivers with their latest route summary
  async getDriversWithRouteSummary(req: Request, res: Response) {
    try {
      const managerId = (req as any).user._id;
      const { date } = req.query;

      // Verify the user is a manager
      const manager = await User.findById(managerId);
      if (!manager || manager.role !== UserRole.MANAGER) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only managers can view managed drivers.'
        });
      }

      // Get all drivers managed by this manager
      const drivers = await User.find({
        managerId: managerId,
        role: UserRole.DRIVER,
        isActive: true
      }).select('-password').sort({ firstName: 1, lastName: 1 });

      // Parse date or use today
      const targetDate = date ? new Date(date as string) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get route summaries for each driver
      const driversWithRoutes = await Promise.all(
        drivers.map(async (driver) => {
          // Get driver's vehicle
          const vehicle = await Vehicle.findOne({ driverId: driver._id });
          
          // Get location count for the day
          const locationCount = await LocationLog.countDocuments({
            userId: driver._id,
            timestamp: {
              $gte: startOfDay,
              $lte: endOfDay
            }
          });

          // Get first and last location of the day
          const firstLocation = await LocationLog.findOne({
            userId: driver._id,
            timestamp: {
              $gte: startOfDay,
              $lte: endOfDay
            }
          }).sort({ timestamp: 1 });

          const lastLocation = await LocationLog.findOne({
            userId: driver._id,
            timestamp: {
              $gte: startOfDay,
              $lte: endOfDay
            }
          }).sort({ timestamp: -1 });

          return {
            ...driver.toObject(),
            vehicle: vehicle ? {
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              licensePlate: vehicle.licensePlate
            } : null,
            routeSummary: {
              totalPoints: locationCount,
              hasData: locationCount > 0,
              startTime: firstLocation?.timestamp || null,
              endTime: lastLocation?.timestamp || null,
              lastKnownLocation: lastLocation ? {
                latitude: lastLocation.latitude,
                longitude: lastLocation.longitude,
                timestamp: lastLocation.timestamp
              } : null
            }
          };
        })
      );

      res.json({
        success: true,
        data: driversWithRoutes,
        message: `Found ${driversWithRoutes.length} managed drivers with route summaries`
      });
    } catch (error) {
      console.error('Error fetching drivers with route summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching drivers with route summary'
      });
    }
  }

  // Helper methods for distance and duration calculations (same as LocationDatabaseService)
  private static calculateTotalDistance(points: any[]): number {
    if (points.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const distance = ManagerRoutesController.calculateDistance(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude
      );
      totalDistance += distance;
    }
    // Convert from meters to kilometers
    return totalDistance / 1000;
  }

  private static calculateTotalDuration(points: any[]): number {
    if (points.length < 2) return 0;

    const startTime = new Date(points[0].timestamp);
    const endTime = new Date(points[points.length - 1].timestamp);
    return (endTime.getTime() - startTime.getTime()) / 1000; // Duration in seconds
  }

  private static calculateAverageSpeed(points: any[]): number {
    if (points.length === 0) return 0;

    const speeds = points.map(p => p.speed || 0).filter(speed => speed > 0);
    if (speeds.length === 0) return 0;

    const totalSpeed = speeds.reduce((sum, speed) => sum + speed, 0);
    return totalSpeed / speeds.length;
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = ManagerRoutesController.toRadians(lat2 - lat1);
    const dLon = ManagerRoutesController.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(ManagerRoutesController.toRadians(lat1)) * Math.cos(ManagerRoutesController.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
