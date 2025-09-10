// Local type definitions for routes

export interface DailyRoute {
  date: string;
  deviceId: string;
  totalPoints: number;
  totalDistance: number;
  totalDuration: number;
  averageSpeed: number;
  maxSpeed: number;
  startLocation: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  endLocation: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  routePoints: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
    speed?: number;
    accuracy: number;
  }>;
}

export interface RouteStats {
  deviceId: string;
  period: string;
  totalRoutes: number;
  totalDistance: number;
  totalDuration: number;
  averageSpeed: number;
  maxSpeed: number;
}

