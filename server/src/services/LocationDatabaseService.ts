import { LocationLog, ILocationLog } from '../models/LocationLog';
import { Device, IDevice } from '../models/Device';
// import { DailyRoute } from '@fleet-management/shared';

export class LocationDatabaseService {
  
  /**
   * Save location data to MongoDB
   */
  static async saveLocationData(locationData: any): Promise<ILocationLog> {
    try {
      // Create location log entry
      const locationLog = new LocationLog({
        deviceId: locationData.deviceId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: new Date(locationData.timestamp),
        speed: locationData.speed,
        bearing: locationData.bearing,
        altitude: locationData.altitude
      });

      const savedLocation = await locationLog.save();

      // Update or create device record
      await this.updateDeviceInfo(locationData.deviceId);

      console.log(`📊 Saved location for device ${locationData.deviceId}: ${locationData.latitude}, ${locationData.longitude}`);
      return savedLocation;

    } catch (error) {
      console.error('❌ Error saving location data:', error);
      throw error;
    }
  }

  /**
   * Update or create device information
   */
  static async updateDeviceInfo(deviceId: string): Promise<IDevice> {
    try {
      const device = await Device.findOneAndUpdate(
        { deviceId },
        {
          $set: {
            lastSeen: new Date(),
            isActive: true
          },
          $inc: {
            totalLocations: 1
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      return device;
    } catch (error) {
      console.error('❌ Error updating device info:', error);
      throw error;
    }
  }

  /**
   * Get device daily routes from MongoDB
   */
  static async getDeviceDailyRoutes(deviceId: string, date?: string): Promise<any[]> {
    try {
      let query: any = { deviceId };
      
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        
        query.timestamp = {
          $gte: startDate,
          $lt: endDate
        };
      }

      const locations = await LocationLog.find(query).sort({ timestamp: 1 });

      if (locations.length === 0) {
        return [];
      }

      // Group locations by day
      const dailyRoutesMap = new Map<string, any[]>();
      locations.forEach(loc => {
        const day = loc.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
        if (!dailyRoutesMap.has(day)) {
          dailyRoutesMap.set(day, []);
        }
        dailyRoutesMap.get(day)!.push(loc);
      });

      const dailyRoutes: any[] = [];
      for (const [day, dayLocations] of dailyRoutesMap.entries()) {
        const routePoints = dayLocations.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          timestamp: loc.timestamp.toISOString(),
          speed: loc.speed,
          accuracy: loc.accuracy
        }));

        const totalDistance = this.calculateTotalDistance(routePoints);
        const totalDuration = this.calculateTotalDuration(routePoints);
        const averageSpeed = this.calculateAverageSpeed(routePoints);
        const maxSpeed = Math.max(...routePoints.map(p => p.speed || 0));

        const dailyRoute: any = {
          date: day,
          deviceId,
          totalPoints: routePoints.length,
          totalDistance,
          totalDuration,
          averageSpeed,
          maxSpeed,
          startLocation: {
            latitude: routePoints[0].latitude,
            longitude: routePoints[0].longitude,
            timestamp: routePoints[0].timestamp
          },
          endLocation: {
            latitude: routePoints[routePoints.length - 1].latitude,
            longitude: routePoints[routePoints.length - 1].longitude,
            timestamp: routePoints[routePoints.length - 1].timestamp
          },
          routePoints
        };

        dailyRoutes.push(dailyRoute);
      }

      return dailyRoutes;

    } catch (error) {
      console.error('❌ Error getting device daily routes:', error);
      throw error;
    }
  }

  /**
   * Get all devices with their statistics
   */
  static async getAllDevices(): Promise<IDevice[]> {
    try {
      return await Device.find({ isActive: true }).sort({ lastSeen: -1 });
    } catch (error) {
      console.error('❌ Error getting all devices:', error);
      throw error;
    }
  }

  /**
   * Get device statistics
   */
  static async getDeviceStats(deviceId: string): Promise<any> {
    try {
      const device = await Device.findOne({ deviceId });
      if (!device) {
        return null;
      }

      const totalLocations = await LocationLog.countDocuments({ deviceId });
      const firstLocation = await LocationLog.findOne({ deviceId }).sort({ timestamp: 1 });
      const lastLocation = await LocationLog.findOne({ deviceId }).sort({ timestamp: -1 });

      return {
        deviceId: device.deviceId,
        deviceFingerprint: device.deviceFingerprint,
        manufacturer: device.manufacturer,
        model: device.deviceModel,
        androidVersion: device.androidVersion,
        firstSeen: device.firstSeen,
        lastSeen: device.lastSeen,
        totalLocations,
        firstLocation: firstLocation ? {
          latitude: firstLocation.latitude,
          longitude: firstLocation.longitude,
          timestamp: firstLocation.timestamp
        } : null,
        lastLocation: lastLocation ? {
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude,
          timestamp: lastLocation.timestamp
        } : null
      };
    } catch (error) {
      console.error('❌ Error getting device stats:', error);
      throw error;
    }
  }

  /**
   * Calculate total distance using Haversine formula
   */
  private static calculateTotalDistance(points: any[]): number {
    if (points.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const distance = this.calculateDistance(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude
      );
      totalDistance += distance;
    }
    return totalDistance;
  }

  /**
   * Calculate total duration in seconds
   */
  private static calculateTotalDuration(points: any[]): number {
    if (points.length < 2) return 0;

    const startTime = new Date(points[0].timestamp);
    const endTime = new Date(points[points.length - 1].timestamp);
    return (endTime.getTime() - startTime.getTime()) / 1000;
  }

  /**
   * Calculate average speed
   */
  private static calculateAverageSpeed(points: any[]): number {
    if (points.length === 0) return 0;

    const speeds = points.map(p => p.speed || 0).filter(s => s > 0);
    if (speeds.length === 0) return 0;

    return speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
