import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@fleet-management/shared';

export class DashboardController {
  
  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = {
        totalVehicles: 5,
        activeTrips: 2,
        totalDrivers: 3,
        maintenanceAlerts: 1,
        fuelConsumption: 45.2,
        totalDistance: 1250.5
      };
      
      const response: ApiResponse<any> = {
        success: true,
        data: stats,
        message: 'Dashboard stats retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  getRecentActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const activities = [
        {
          id: '1',
          type: 'TRIP_STARTED',
          description: 'Trip started from NYC to Boston',
          timestamp: new Date().toISOString(),
          vehicleId: 'V001'
        },
        {
          id: '2',
          type: 'MAINTENANCE_COMPLETED',
          description: 'Oil change completed for V002',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          vehicleId: 'V002'
        }
      ];
      
      const response: ApiResponse<any> = {
        success: true,
        data: activities,
        message: 'Recent activity retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  getAlerts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alerts = [
        {
          id: '1',
          type: 'MAINTENANCE_DUE',
          severity: 'MEDIUM',
          message: 'Vehicle V003 maintenance due in 500 miles',
          vehicleId: 'V003'
        }
      ];
      
      const response: ApiResponse<any> = {
        success: true,
        data: alerts,
        message: 'Alerts retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
