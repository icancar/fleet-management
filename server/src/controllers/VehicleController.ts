import { Request, Response, NextFunction } from 'express';
import { Vehicle, IVehicle } from '../models/Vehicle';
import { User, UserRole } from '../models/User';
import { ApiResponse } from '@fleet-management/shared';

export class VehicleController {
  
  getAllVehicles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;
      let vehicles: IVehicle[];

      switch (currentUser.role) {
        case UserRole.ADMIN:
          // Admin can see all vehicles in their company
          vehicles = await Vehicle.find({ 
            companyId: currentUser.companyId
          }).populate('driverId', 'firstName lastName email');
          break;

        case UserRole.MANAGER:
          // Manager can only see vehicles assigned to drivers they manage
          // First, get all drivers that this manager manages
          const managedDrivers = await User.find({
            managerId: currentUser._id,
            role: UserRole.DRIVER,
            isActive: true
          }).select('_id');
          
          const managedDriverIds = managedDrivers.map(driver => driver._id);
          
          // Then get vehicles assigned to these drivers
          vehicles = await Vehicle.find({ 
            driverId: { $in: managedDriverIds },
            companyId: currentUser.companyId
          }).populate('driverId', 'firstName lastName email');
          break;

        case UserRole.DRIVER:
          // Driver can only see their assigned vehicle
          vehicles = await Vehicle.find({ 
            driverId: currentUser._id,
            companyId: currentUser.companyId
          }).populate('driverId', 'firstName lastName email');
          break;

        default:
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions'
          });
      }

      // Add dynamic status to each vehicle and update database if needed
      const vehiclesWithDynamicStatus = await Promise.all(vehicles.map(async (vehicle) => {
        const vehicleObj = vehicle.toObject();
        const today = new Date();
        const serviceDate = new Date(vehicle.nextServiceDate);
        const daysUntilService = Math.ceil((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate dynamic status
        let dynamicStatus = vehicle.status;
        if (daysUntilService < 0) {
          dynamicStatus = 'maintenance'; // Overdue
        } else if (daysUntilService <= 10) {
          dynamicStatus = 'maintenance'; // Due within 10 days
        } else {
          // If more than 10 days away and currently marked as maintenance, reset to active
          if (vehicle.status === 'maintenance') {
            dynamicStatus = 'active';
          }
        }
        
        // Update database status if it differs from calculated status
        if (vehicle.status !== dynamicStatus) {
          console.log(`Updating vehicle ${vehicle.licensePlate} status from ${vehicle.status} to ${dynamicStatus}`);
          await Vehicle.findByIdAndUpdate(vehicle._id, { status: dynamicStatus });
        }
        
        return {
          ...vehicleObj,
          status: dynamicStatus,
          daysUntilService: daysUntilService
        };
      }));

      const response: ApiResponse<any[]> = {
        success: true,
        data: vehiclesWithDynamicStatus,
        message: 'Vehicles retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getVehicleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;

      let vehicleQuery: any = { 
        _id: id,
        companyId: currentUser.companyId
      };

      // If user is a manager, ensure they can only access vehicles assigned to drivers they manage
      if (currentUser.role === UserRole.MANAGER) {
        // First get all drivers that this manager manages
        const managedDrivers = await User.find({
          managerId: currentUser._id,
          role: UserRole.DRIVER,
          isActive: true
        }).select('_id');
        
        const managedDriverIds = managedDrivers.map(driver => driver._id);
        vehicleQuery.driverId = { $in: managedDriverIds };
      }

      const vehicle = await Vehicle.findOne(vehicleQuery).populate('driverId', 'firstName lastName email');

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: currentUser.role === UserRole.MANAGER 
            ? 'Vehicle not found or you do not have permission to view this vehicle'
            : 'Vehicle not found'
        });
      }

      // Check permissions for drivers
      if (currentUser.role === UserRole.DRIVER && vehicle.driverId?._id.toString() !== currentUser._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Can only view your assigned vehicle'
        });
      }
      
      const response: ApiResponse<IVehicle> = {
        success: true,
        data: vehicle,
        message: 'Vehicle retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  createVehicle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;
      const { licensePlate, make, model, year, vin, nextServiceDate, odometer, driverId } = req.body;
      const vehicleModel = model; // Map model to vehicleModel for database

      // Check permissions
      if (currentUser.role === UserRole.DRIVER) {
        return res.status(403).json({
          success: false,
          message: 'Drivers cannot create vehicles'
        });
      }

      // Validate driver assignment if provided
      if (driverId) {
        let driverQuery: any = { 
          _id: driverId, 
          role: UserRole.DRIVER,
          companyId: currentUser.companyId,
          isActive: true 
        };

        // If user is a manager, ensure they can only assign drivers they manage
        if (currentUser.role === UserRole.MANAGER) {
          driverQuery.managerId = currentUser._id;
        }

        const driver = await User.findOne(driverQuery);
        
        if (!driver) {
          return res.status(400).json({
            success: false,
            message: currentUser.role === UserRole.MANAGER 
              ? 'Invalid driver assignment. You can only assign drivers you manage.'
              : 'Invalid driver assignment'
          });
        }

        // Check if driver is already assigned to another vehicle
        const existingAssignment = await Vehicle.findOne({ 
          driverId: driverId,
          status: 'active'
        });
        
        if (existingAssignment) {
          return res.status(400).json({
            success: false,
            message: 'Driver is already assigned to another vehicle'
          });
        }
      }

      // Create new vehicle
      const vehicle = new Vehicle({
        licensePlate,
        make,
        vehicleModel,
        year,
        vin,
        nextServiceDate,
        odometer,
        driverId: driverId || undefined,
        companyId: currentUser.companyId
      });

      await vehicle.save();
      
      const response: ApiResponse<IVehicle> = {
        success: true,
        data: vehicle,
        message: 'Vehicle created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateVehicle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;
      const { licensePlate, make, model, year, vin, nextServiceDate, odometer, status, driverId } = req.body;
      const vehicleModel = model; // Map model to vehicleModel for database
      
      let vehicleQuery: any = { 
        _id: id,
        companyId: currentUser.companyId
      };

      // If user is a manager, ensure they can only update vehicles assigned to drivers they manage
      if (currentUser.role === UserRole.MANAGER) {
        // First get all drivers that this manager manages
        const managedDrivers = await User.find({
          managerId: currentUser._id,
          role: UserRole.DRIVER,
          isActive: true
        }).select('_id');
        
        const managedDriverIds = managedDrivers.map(driver => driver._id);
        vehicleQuery.driverId = { $in: managedDriverIds };
      }

      const vehicle = await Vehicle.findOne(vehicleQuery);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: currentUser.role === UserRole.MANAGER 
            ? 'Vehicle not found or you do not have permission to update this vehicle'
            : 'Vehicle not found'
        });
      }

      // Check permissions for drivers
      if (currentUser.role === UserRole.DRIVER) {
        // Drivers can only update odometer
        if (odometer !== undefined) {
          vehicle.odometer = odometer;
        } else {
          return res.status(403).json({
            success: false,
            message: 'Drivers can only update odometer reading'
          });
        }
      } else {
        // Managers and Admins can update most fields
        if (licensePlate) vehicle.licensePlate = licensePlate;
        if (make) vehicle.make = make;
        if (vehicleModel) vehicle.vehicleModel = vehicleModel;
        if (year) vehicle.year = year;
        if (vin) vehicle.vin = vin;
        if (nextServiceDate) vehicle.nextServiceDate = nextServiceDate;
        if (odometer !== undefined) vehicle.odometer = odometer;
        if (status) vehicle.status = status;

        // Handle driver assignment
        if (driverId !== undefined) {
          if (driverId) {
            // Assign driver
            let driverQuery: any = { 
              _id: driverId, 
              role: UserRole.DRIVER,
              companyId: currentUser.companyId,
              isActive: true 
            };

            // If user is a manager, ensure they can only assign drivers they manage
            if (currentUser.role === UserRole.MANAGER) {
              driverQuery.managerId = currentUser._id;
            }

            const driver = await User.findOne(driverQuery);
            
            if (!driver) {
              return res.status(400).json({
                success: false,
                message: currentUser.role === UserRole.MANAGER 
                  ? 'Invalid driver assignment. You can only assign drivers you manage.'
                  : 'Invalid driver assignment'
              });
            }

            // Check if driver is already assigned to another vehicle
            const existingAssignment = await Vehicle.findOne({ 
              driverId: driverId,
              status: 'active',
              _id: { $ne: id }
            });
            
            if (existingAssignment) {
              return res.status(400).json({
                success: false,
                message: 'Driver is already assigned to another vehicle'
              });
            }

            vehicle.driverId = driverId;
          } else {
            // Unassign driver
            vehicle.driverId = undefined;
          }
        }
      }

      await vehicle.save();
      
      const response: ApiResponse<IVehicle> = {
        success: true,
        data: vehicle,
        message: 'Vehicle updated successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  deleteVehicle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;

      // Check permissions
      if (currentUser.role === UserRole.DRIVER) {
        return res.status(403).json({
          success: false,
          message: 'Drivers cannot delete vehicles'
        });
      }

      const vehicle = await Vehicle.findOne({ 
        _id: id,
        companyId: currentUser.companyId
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Soft delete by changing status
      vehicle.status = 'out_of_service';
      vehicle.driverId = undefined; // Unassign driver
      await vehicle.save();
      
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Vehicle deactivated successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get available drivers for assignment
  getAvailableDrivers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;

      // Check permissions
      if (currentUser.role === UserRole.DRIVER) {
        return res.status(403).json({
          success: false,
          message: 'Drivers cannot view driver assignments'
        });
      }

      let allDrivers;

      if (currentUser.role === UserRole.ADMIN) {
        // Admin can see all drivers in their company
        allDrivers = await User.find({
          role: UserRole.DRIVER,
          companyId: currentUser.companyId,
          isActive: true
        }).select('firstName lastName email _id');
      } else if (currentUser.role === UserRole.MANAGER) {
        // Manager can only see drivers they manage
        allDrivers = await User.find({
          role: UserRole.DRIVER,
          managerId: currentUser._id,
          companyId: currentUser.companyId,
          isActive: true
        }).select('firstName lastName email _id');
      }

      const response: ApiResponse<any> = {
        success: true,
        data: allDrivers,
        message: 'Drivers retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark service as done - extends service date by 1 year
   */
  public markServiceDone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;

      const vehicle = await Vehicle.findOne({ 
        _id: id,
        companyId: currentUser.companyId
      });

      if (!vehicle) {
        res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
        return;
      }

      // Extend service date by 1 year from current date
      const newServiceDate = new Date();
      newServiceDate.setFullYear(newServiceDate.getFullYear() + 1);

      vehicle.nextServiceDate = newServiceDate;
      vehicle.status = 'active'; // Mark as active since service is done
      await vehicle.save();

      const response: ApiResponse<any> = {
        success: true,
        data: {
          id: vehicle._id,
          nextServiceDate: vehicle.nextServiceDate,
          status: vehicle.status
        },
        message: 'Service marked as done successfully. Next service due in 1 year.'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}