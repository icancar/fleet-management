import { PaginationParams, PaginatedResponse } from '@fleet-management/shared';

interface LocationData {
  deviceId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  speed?: number;
  bearing?: number;
  altitude?: number;
}

interface DailyRoute {
  date: string;
  deviceId: string;
  totalPoints: number;
  totalDistance: number;
  totalDuration: number;
  averageSpeed: number;
  maxSpeed: number;
  startLocation: { latitude: number; longitude: number; timestamp: string };
  endLocation: { latitude: number; longitude: number; timestamp: string };
  routePoints: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
    speed?: number;
    accuracy: number;
  }>;
}

export class LocationService {
  
  // In-memory storage for now (replace with database later)
  private locations: LocationData[] = [];

  async saveLocation(locationData: LocationData): Promise<LocationData> {
    // Add timestamp if not provided
    if (!locationData.timestamp) {
      locationData.timestamp = new Date().toISOString();
    }
    
    // Store location data
    this.locations.push(locationData);
    
    // Keep only last 1000 locations to prevent memory issues
    if (this.locations.length > 1000) {
      this.locations.slice(-1000);
    }
    
    return locationData;
  }

  async getLocationHistory(params: PaginationParams): Promise<PaginatedResponse<LocationData>> {
    const { page, limit } = params;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const data = this.locations.slice(startIndex, endIndex);
    const total = this.locations.length;
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getDeviceLocationHistory(deviceId: string, params: PaginationParams): Promise<PaginatedResponse<LocationData>> {
    const { page, limit } = params;
    const deviceLocations = this.locations.filter(loc => loc.deviceId === deviceId);
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const data = deviceLocations.slice(startIndex, endIndex);
    const total = deviceLocations.length;
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getLatestLocation(deviceId: string): Promise<LocationData | null> {
    const deviceLocations = this.locations.filter(loc => loc.deviceId === deviceId);
    return deviceLocations.length > 0 ? deviceLocations[deviceLocations.length - 1] : null;
  }

  // New method: Get daily routes for a device
  async getDeviceDailyRoutes(deviceId: string, date?: string): Promise<DailyRoute[]> {
    const deviceLocations = this.locations.filter(loc => loc.deviceId === deviceId);
    
    if (deviceLocations.length === 0) {
      return [];
    }

    // Group locations by date
    const locationsByDate = new Map<string, LocationData[]>();
    
    deviceLocations.forEach(location => {
      const locationDate = new Date(location.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!date || locationDate === date) {
        if (!locationsByDate.has(locationDate)) {
          locationsByDate.set(locationDate, []);
        }
        locationsByDate.get(locationDate)!.push(location);
      }
    });

    // Convert to DailyRoute objects
    const dailyRoutes: DailyRoute[] = [];
    
    for (const [dateKey, dayLocations] of locationsByDate) {
      if (dayLocations.length < 2) continue; // Need at least 2 points for a route
      
      // Sort by timestamp
      dayLocations.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      const startLocation = dayLocations[0];
      const endLocation = dayLocations[dayLocations.length - 1];
      
      // Calculate total distance
      let totalDistance = 0;
      for (let i = 1; i < dayLocations.length; i++) {
        totalDistance += this.calculateDistance(
          dayLocations[i-1].latitude, dayLocations[i-1].longitude,
          dayLocations[i].latitude, dayLocations[i].longitude
        );
      }
      
      // Calculate duration
      const startTime = new Date(startLocation.timestamp).getTime();
      const endTime = new Date(endLocation.timestamp).getTime();
      const totalDuration = (endTime - startTime) / 1000; // in seconds
      
      // Calculate speed statistics
      const speeds = dayLocations.filter(loc => loc.speed && loc.speed > 0).map(loc => loc.speed!);
      const averageSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
      const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
      
      const dailyRoute: DailyRoute = {
        date: dateKey,
        deviceId,
        totalPoints: dayLocations.length,
        totalDistance,
        totalDuration,
        averageSpeed,
        maxSpeed,
        startLocation: {
          latitude: startLocation.latitude,
          longitude: startLocation.longitude,
          timestamp: startLocation.timestamp
        },
        endLocation: {
          latitude: endLocation.latitude,
          longitude: endLocation.longitude,
          timestamp: endLocation.timestamp
        },
        routePoints: dayLocations.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          timestamp: loc.timestamp,
          speed: loc.speed,
          accuracy: loc.accuracy
        }))
      };
      
      dailyRoutes.push(dailyRoute);
    }
    
    // Sort by date (newest first)
    return dailyRoutes.sort((a, b) => b.date.localeCompare(a.date));
  }

  // New method: Get all daily routes for all devices
  async getAllDailyRoutes(date?: string): Promise<DailyRoute[]> {
    const allRoutes: DailyRoute[] = [];
    const deviceIds = [...new Set(this.locations.map(loc => loc.deviceId))];
    
    for (const deviceId of deviceIds) {
      const deviceRoutes = await this.getDeviceDailyRoutes(deviceId, date);
      allRoutes.push(...deviceRoutes);
    }
    
    return allRoutes.sort((a, b) => b.date.localeCompare(a.date));
  }

  // Helper method: Calculate distance between two coordinates (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance * 1000; // Convert to meters
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}
