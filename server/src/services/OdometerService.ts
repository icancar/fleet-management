import { Vehicle } from '../models/Vehicle';
import { User } from '../models/User';
import { LocationLog } from '../models/LocationLog';

export class OdometerService {
  
  /**
   * Update vehicle odometer based on new location data
   */
  static async updateOdometer(deviceId: string, userId: string, newLocation: any): Promise<void> {
    try {
      // Find the user to get their assigned vehicle
      const user = await User.findById(userId);
      if (!user) {
        console.log(`❌ User ${userId} not found for odometer update`);
        return;
      }

      // Find the vehicle assigned to this user
      const vehicle = await Vehicle.findOne({ driverId: userId });
      if (!vehicle) {
        console.log(`❌ No vehicle assigned to user ${userId} for odometer update`);
        return;
      }

      // Get the last location for this device to calculate distance
      const lastLocation = await LocationLog.findOne({ 
        deviceId,
        userId 
      }).sort({ timestamp: -1 });

      if (!lastLocation) {
        console.log(`📊 First location for device ${deviceId}, no odometer update needed`);
        return;
      }

      // Calculate distance between last location and new location
      const distance = this.calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        newLocation.latitude,
        newLocation.longitude
      );

      // Only update odometer if distance is significant (more than 10 meters)
      // This helps filter out GPS noise and stationary readings
      if (distance > 10) {
        // Convert meters to kilometers and add to odometer
        const distanceKm = distance / 1000;
        const newOdometerReading = vehicle.odometer + distanceKm;

        // Update the vehicle's odometer
        await Vehicle.findByIdAndUpdate(vehicle._id, {
          odometer: newOdometerReading
        });

        console.log(`🚗 Odometer updated for vehicle ${vehicle.licensePlate}:`);
        console.log(`   Previous reading: ${vehicle.odometer.toFixed(2)} km`);
        console.log(`   Distance traveled: ${distanceKm.toFixed(3)} km`);
        console.log(`   New reading: ${newOdometerReading.toFixed(2)} km`);
      } else {
        console.log(`📊 Distance too small (${distance.toFixed(2)}m), skipping odometer update`);
      }

    } catch (error) {
      console.error('❌ Error updating odometer:', error);
      // Don't throw error to avoid breaking location saving
    }
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

  /**
   * Get current odometer reading for a vehicle
   */
  static async getCurrentOdometer(vehicleId: string): Promise<number | null> {
    try {
      const vehicle = await Vehicle.findById(vehicleId);
      return vehicle ? vehicle.odometer : null;
    } catch (error) {
      console.error('❌ Error getting current odometer:', error);
      return null;
    }
  }

  /**
   * Get odometer reading for a user's assigned vehicle
   */
  static async getOdometerForUser(userId: string): Promise<number | null> {
    try {
      const vehicle = await Vehicle.findOne({ driverId: userId });
      return vehicle ? vehicle.odometer : null;
    } catch (error) {
      console.error('❌ Error getting odometer for user:', error);
      return null;
    }
  }

  /**
   * Manually set odometer reading (for maintenance or corrections)
   */
  static async setOdometer(vehicleId: string, newReading: number): Promise<boolean> {
    try {
      await Vehicle.findByIdAndUpdate(vehicleId, {
        odometer: newReading
      });
      console.log(`🔧 Odometer manually set to ${newReading} km for vehicle ${vehicleId}`);
      return true;
    } catch (error) {
      console.error('❌ Error setting odometer:', error);
      return false;
    }
  }
}
