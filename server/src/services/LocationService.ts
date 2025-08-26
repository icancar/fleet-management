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
      this.locations = this.locations.slice(-1000);
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
}
