import { Request, Response, NextFunction } from 'express';
import { User, UserRole, IUser } from '../models/User';
import { Company } from '../models/Company';
import { Device } from '../models/Device';
import { LocationLog } from '../models/LocationLog';
import { ApiResponse } from '@fleet-management/shared';

export class UserController {
  /**
   * Get all users (role-based access)
   */
  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;
      let users: IUser[];

      switch (currentUser.role) {
        case UserRole.ADMIN:
          // Admin can see all users in their company
          users = await User.find({ 
            companyId: currentUser.companyId,
            isActive: true 
          }).select('-password').populate('managerId', 'firstName lastName email role');
          break;

        case UserRole.MANAGER:
          // Manager can see their assigned drivers and themselves
          const managerDrivers = await User.find({ 
            managerId: currentUser._id,
            isActive: true 
          }).select('-password').populate('managerId', 'firstName lastName email role');
          
          const managerSelf = await User.findById(currentUser._id).select('-password').populate('managerId', 'firstName lastName email role');
          users = managerSelf ? [managerSelf, ...managerDrivers] : managerDrivers;
          break;

        default:
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions'
          });
      }

      const response: ApiResponse<any> = {
        success: true,
        data: users,
        message: 'Users retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user by ID
   */
  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const currentUser = (req as any).user;

      // Check permissions
      if (currentUser.role === UserRole.DRIVER && currentUser._id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Can only view your own profile'
        });
      }

      if (currentUser.role === UserRole.MANAGER) {
        const user = await User.findById(userId);
        if (!user || user.managerId !== currentUser._id) {
          return res.status(403).json({
            success: false,
            message: 'Can only view your assigned drivers'
          });
        }
      }

      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const response: ApiResponse<any> = {
        success: true,
        data: user,
        message: 'User retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new user (Manager or Company Owner only)
   */
  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;
      const { email, password, firstName, lastName, role, phone, managerId } = req.body;

      // Check permissions
      if (currentUser.role === UserRole.DRIVER) {
        return res.status(403).json({
          success: false,
          message: 'Drivers cannot create users'
        });
      }

      if (currentUser.role === UserRole.MANAGER && role !== UserRole.DRIVER) {
        return res.status(403).json({
          success: false,
          message: 'Managers can only create drivers'
        });
      }

      // Set manager ID for drivers
      const finalManagerId = role === UserRole.DRIVER 
        ? (managerId || currentUser._id) 
        : undefined;

      const user = new User({
        email,
        password,
        firstName,
        lastName,
        role,
        phone,
        companyId: currentUser.companyId,
        managerId: finalManagerId
      });

      await user.save();

      const response: ApiResponse<any> = {
        success: true,
        data: user.toJSON(),
        message: 'User created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user
   */
  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const currentUser = (req as any).user;
      const { firstName, lastName, phone, isActive } = req.body;

      // Check permissions
      if (currentUser.role === UserRole.DRIVER && currentUser._id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Can only update your own profile'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update allowed fields
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phone !== undefined) user.phone = phone;
      if (isActive !== undefined && currentUser.role !== UserRole.DRIVER) {
        user.isActive = isActive;
      }

      await user.save();

      const response: ApiResponse<any> = {
        success: true,
        data: user.toJSON(),
        message: 'User updated successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete user (soft delete)
   */
  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const currentUser = (req as any).user;

      // Check permissions
      if (currentUser.role === UserRole.DRIVER) {
        return res.status(403).json({
          success: false,
          message: 'Drivers cannot delete users'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Soft delete
      user.isActive = false;
      await user.save();

      const response: ApiResponse<any> = {
        success: true,
        message: 'User deactivated successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's devices
   */
  getUserDevices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const currentUser = (req as any).user;

      // Check permissions
      if (currentUser.role === UserRole.DRIVER && currentUser._id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Can only view your own devices'
        });
      }

      const devices = await Device.find({ userId, isActive: true });

      const response: ApiResponse<any> = {
        success: true,
        data: devices,
        message: 'User devices retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's location data (role-based)
   */
  getUserLocationData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { date, limit = 100 } = req.query;
      const currentUser = (req as any).user;

      // Check permissions
      if (currentUser.role === UserRole.DRIVER && currentUser._id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Can only view your own location data'
        });
      }

      if (currentUser.role === UserRole.MANAGER) {
        const user = await User.findById(userId);
        if (!user || user.managerId !== currentUser._id) {
          return res.status(403).json({
            success: false,
            message: 'Can only view your assigned drivers\' location data'
          });
        }
      }

      // Get user's devices
      const devices = await Device.find({ userId, isActive: true });
      const deviceIds = devices.map(device => device.deviceId);

      if (deviceIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'No devices found for this user'
        });
      }

      // Build query
      const query: any = { deviceId: { $in: deviceIds } };
      if (date) {
        const startDate = new Date(date as string);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        query.timestamp = { $gte: startDate, $lt: endDate };
      }

      const locations = await LocationLog.find(query)
        .sort({ timestamp: -1 })
        .limit(Number(limit));

      const response: ApiResponse<any> = {
        success: true,
        data: locations,
        message: 'User location data retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
