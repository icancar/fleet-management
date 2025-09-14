import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { ApiResponse } from '@fleet-management/shared';
import { User, UserRole, IUser } from '../models/User';
import bcrypt from 'bcryptjs';

export class DriverController {
  
  getAllDrivers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;
      let drivers: IUser[];

      switch (currentUser.role) {
        case UserRole.ADMIN:
          // Admin can see all drivers in their company
          drivers = await User.find({ 
            companyId: currentUser.companyId,
            role: UserRole.DRIVER,
            isActive: true 
          }).select('-password').populate('managerId', 'firstName lastName email role');
          break;

        case UserRole.MANAGER:
          // Manager can see their assigned drivers
          drivers = await User.find({ 
            managerId: currentUser._id,
            role: UserRole.DRIVER,
            isActive: true 
          }).select('-password').populate('managerId', 'firstName lastName email role');
          break;

        default:
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions'
          });
      }

      const response: ApiResponse<IUser[]> = {
        success: true,
        data: drivers,
        message: 'Drivers retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // New method for getting all employees (managers + drivers) for Admin
  getAllEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;


      if (currentUser.role !== UserRole.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Only admins can view all employees'
        });
      }

      // Get all managers and drivers in the company
      const [managers, drivers] = await Promise.all([
        User.find({ 
          companyId: currentUser.companyId,
          role: UserRole.MANAGER,
          isActive: true 
        }).select('-password').populate('managerId', 'firstName lastName email role'),
        
        User.find({ 
          companyId: currentUser.companyId,
          role: UserRole.DRIVER,
          isActive: true 
        }).select('-password').populate('managerId', 'firstName lastName email role')
      ]);


      const response: ApiResponse<{ managers: IUser[], drivers: IUser[] }> = {
        success: true,
        data: { managers, drivers },
        message: 'Employees retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error in getAllEmployees:', error);
      next(error);
    }
  };
  
  getDriverById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;

      const driver = await User.findOne({ 
        _id: id, 
        role: UserRole.DRIVER,
        isActive: true 
      }).select('-password');

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }

      // Check permissions
      if (currentUser.role === UserRole.MANAGER && driver.managerId && driver.managerId.toString() !== currentUser._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Can only view your assigned drivers'
        });
      }

      if (currentUser.role === UserRole.ADMIN && driver.companyId !== currentUser.companyId) {
        return res.status(403).json({
          success: false,
          message: 'Can only view drivers from your company'
        });
      }
      
      const response: ApiResponse<IUser> = {
        success: true,
        data: driver,
        message: 'Driver retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  createDriver = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;
      const { email, password, firstName, lastName, phone, managerId } = req.body;

      // Check permissions
      if (currentUser.role === UserRole.DRIVER) {
        return res.status(403).json({
          success: false,
          message: 'Drivers cannot create other drivers'
        });
      }

      // Determine managerId based on user role
      let assignedManagerId;
      if (currentUser.role === UserRole.MANAGER) {
        // If current user is a manager, they become the manager of the new driver
        assignedManagerId = currentUser._id;
      } else if (currentUser.role === UserRole.ADMIN) {
        // If current user is admin, use the managerId from the request
        assignedManagerId = managerId;
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new driver
      const driver = new User({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: UserRole.DRIVER,
        phone,
        companyId: currentUser.companyId,
        managerId: assignedManagerId
      });

      await driver.save();
      
      const response: ApiResponse<IUser> = {
        success: true,
        data: driver.toJSON(),
        message: 'Driver created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  
  updateDriver = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;
      const { firstName, lastName, phone, isActive } = req.body;

      const driver = await User.findOne({ 
        _id: id, 
        role: UserRole.DRIVER,
        isActive: true 
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }

      // Check permissions
      if (currentUser.role === UserRole.MANAGER && driver.managerId && driver.managerId.toString() !== currentUser._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Can only update your assigned drivers'
        });
      }

      if (currentUser.role === UserRole.ADMIN && driver.companyId !== currentUser.companyId) {
        return res.status(403).json({
          success: false,
          message: 'Can only update drivers from your company'
        });
      }

      // Update allowed fields
      if (firstName) driver.firstName = firstName;
      if (lastName) driver.lastName = lastName;
      if (phone !== undefined) driver.phone = phone;
      if (isActive !== undefined) driver.isActive = isActive;

      await driver.save();
      
      const response: ApiResponse<IUser> = {
        success: true,
        data: driver.toJSON(),
        message: 'Driver updated successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  deleteDriver = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;

      const driver = await User.findOne({ 
        _id: id, 
        role: UserRole.DRIVER,
        isActive: true 
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }

      // Check permissions
      if (currentUser.role === UserRole.MANAGER && driver.managerId && driver.managerId.toString() !== currentUser._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Can only delete your assigned drivers'
        });
      }

      if (currentUser.role === UserRole.ADMIN && driver.companyId !== currentUser.companyId) {
        return res.status(403).json({
          success: false,
          message: 'Can only delete drivers from your company'
        });
      }

      // Soft delete
      driver.isActive = false;
      await driver.save();
      
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Driver deactivated successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // Manager management methods (Admin only)
  createManager = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;
      const { email, password, firstName, lastName, phone } = req.body;

      // Only admins can create managers
      if (currentUser.role !== UserRole.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Only admins can create managers'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new manager
      const manager = new User({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: UserRole.MANAGER,
        managerId: currentUser._id, // Admin is the manager of managers
        companyId: currentUser.companyId,
        isActive: true
      });

      await manager.save();
      
      const response: ApiResponse<IUser> = {
        success: true,
        data: manager,
        message: 'Manager created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateManager = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;
      const { firstName, lastName, phone, isActive } = req.body;


      // Only admins can update managers
      if (currentUser.role !== UserRole.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Only admins can update managers'
        });
      }

      const manager = await User.findOne({ 
        _id: id,
        role: UserRole.MANAGER,
        companyId: currentUser.companyId
      });

      if (!manager) {
        return res.status(404).json({
          success: false,
          message: 'Manager not found'
        });
      }

      // Update fields
      if (firstName) manager.firstName = firstName;
      if (lastName) manager.lastName = lastName;
      if (phone !== undefined) manager.phone = phone;
      if (isActive !== undefined) manager.isActive = isActive;

      await manager.save();
      
      const response: ApiResponse<IUser> = {
        success: true,
        data: manager,
        message: 'Manager updated successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  deleteManager = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;

      // Only admins can delete managers
      if (currentUser.role !== UserRole.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Only admins can delete managers'
        });
      }

      const manager = await User.findOne({ 
        _id: id,
        role: UserRole.MANAGER,
        companyId: currentUser.companyId
      });

      if (!manager) {
        return res.status(404).json({
          success: false,
          message: 'Manager not found'
        });
      }

      // Check if manager has assigned drivers
      const assignedDrivers = await User.countDocuments({ 
        managerId: id,
        isActive: true 
      });

      if (assignedDrivers > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete manager with assigned drivers. Please reassign drivers first.'
        });
      }

      // Soft delete
      manager.isActive = false;
      await manager.save();
      
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Manager deactivated successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
