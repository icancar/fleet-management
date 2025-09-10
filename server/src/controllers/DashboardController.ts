import { Request, Response, NextFunction } from 'express';
import { Vehicle } from '../models/Vehicle';
import { User, UserRole } from '../models/User';
import { ApiResponse } from '@fleet-management/shared';

export class DashboardController {
  
  getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;
      const companyId = currentUser.companyId;

      // Get total vehicles count
      const totalVehicles = await Vehicle.countDocuments({ companyId });
      
      // Get all vehicles to calculate dynamic status
      const allVehicles = await Vehicle.find({ companyId });
      
      // Calculate dynamic status for each vehicle
      const now = new Date();
      const tenDaysFromNow = new Date();
      tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
      
      let activeVehicles = 0;
      let maintenanceVehicles = 0;
      const vehiclesInMaintenance: any[] = [];
      
      for (const vehicle of allVehicles) {
        const serviceDate = new Date(vehicle.nextServiceDate);
        const isMaintenanceDue = serviceDate <= tenDaysFromNow;
        
        if (isMaintenanceDue) {
          maintenanceVehicles++;
          vehiclesInMaintenance.push(vehicle);
          // Update the vehicle status in database and local array
          if (vehicle.status !== 'maintenance') {
            await Vehicle.findByIdAndUpdate(vehicle._id, { status: 'maintenance' });
            vehicle.status = 'maintenance'; // Update local array
          }
        } else {
          activeVehicles++;
          // Reset to active if it was previously maintenance but service is now far enough away
          if (vehicle.status === 'maintenance') {
            await Vehicle.findByIdAndUpdate(vehicle._id, { status: 'active' });
            vehicle.status = 'active'; // Update local array
          }
        }
      }

      // Get out of service vehicles
      const outOfServiceVehicles = await Vehicle.countDocuments({ 
        companyId, 
        status: 'out_of_service' 
      });

      // Get total drivers count
      const totalDrivers = await User.countDocuments({ 
        companyId, 
        role: UserRole.DRIVER, 
        isActive: true 
      });

      // Get assigned drivers count - use updated status
      const assignedDrivers = allVehicles.filter(vehicle => {
        return vehicle.status === 'active' && vehicle.driverId;
      }).length;

      // Get unassigned vehicles count - use updated status
      const unassignedVehicles = allVehicles.filter(vehicle => {
        return vehicle.status === 'active' && !vehicle.driverId;
      }).length;

      // Get overdue vehicles (service date has passed) - use dynamic status
      const overdueVehicles = vehiclesInMaintenance.filter(vehicle => {
        const serviceDate = new Date(vehicle.nextServiceDate);
        return serviceDate < now;
      }).length;

      // Get vehicles due for service (within next 10 days but not overdue) - mutually exclusive with overdue
      const vehiclesDueForService = vehiclesInMaintenance.length - overdueVehicles;

      // Get total odometer reading - use updated status
      const activeVehiclesWithOdometer = allVehicles.filter(vehicle => {
        return vehicle.status === 'active';
      });
      
      const totalMileage = activeVehiclesWithOdometer.reduce((sum, vehicle) => sum + vehicle.odometer, 0);

      // Get recent vehicles (created in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentVehicles = await Vehicle.find({ 
        companyId,
        createdAt: { $gte: thirtyDaysAgo }
      }).populate('driverId', 'firstName lastName').sort({ createdAt: -1 }).limit(5);

      // Get maintenance alerts (vehicles currently in maintenance status)
      const maintenanceAlerts = vehiclesInMaintenance
        .sort((a, b) => new Date(a.nextServiceDate).getTime() - new Date(b.nextServiceDate).getTime())
        .slice(0, 5);
      
      // Populate driver information for maintenance alerts
      for (const vehicle of maintenanceAlerts) {
        if (vehicle.driverId) {
          const driver = await User.findById(vehicle.driverId).select('firstName lastName');
          if (driver) {
            (vehicle as any).driverId = driver;
          }
        }
      }

      const stats = {
        vehicles: {
          total: totalVehicles,
          active: activeVehicles,
          maintenance: maintenanceVehicles,
          outOfService: outOfServiceVehicles,
          unassigned: unassignedVehicles,
          dueForService: vehiclesDueForService,
          overdue: overdueVehicles
        },
        drivers: {
          total: totalDrivers,
          assigned: assignedDrivers,
          unassigned: totalDrivers - assignedDrivers
        },
        mileage: {
          total: totalMileage,
          average: totalMileage / Math.max(activeVehicles, 1)
        }
      };

      const recentActivity = {
        recentVehicles,
        maintenanceAlerts
      };

      const response: ApiResponse<any> = {
        success: true,
        data: {
          stats,
          recentActivity
        },
        message: 'Dashboard stats retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}