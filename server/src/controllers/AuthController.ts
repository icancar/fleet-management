import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { User, UserRole } from '../models/User';
import { ApiResponse } from '@fleet-management/shared';

export class AuthController {
  /**
   * Register a new user
   */
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName, role, phone, companyId, managerId } = req.body;

      const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        role: role || UserRole.DRIVER,
        phone,
        companyId,
        managerId
      });

      const response: ApiResponse<any> = {
        success: true,
        data: result,
        message: 'User registered successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login user
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login({ email, password });

      const response: ApiResponse<any> = {
        success: true,
        data: result,
        message: 'Login successful'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };


  /**
   * Get current user profile
   */
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      const response: ApiResponse<any> = {
        success: true,
        data: user,
        message: 'Profile retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current user profile
   */
  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user; // This comes from the auth middleware
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const response: ApiResponse<any> = {
        success: true,
        data: user,
        message: 'User profile retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user profile
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user._id;
      const { firstName, lastName, email, phone } = req.body;
      
      console.log('Profile update request:', { userId, firstName, lastName, email, phone });

      // Get the full user document (including password) for updating
      const updatedUser = await User.findById(userId);
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if email is being changed and if it already exists
      if (email && email !== updatedUser.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser && (existingUser as any)._id.toString() !== userId.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists'
          });
        }
      }

      // Update allowed fields
      if (firstName) updatedUser.firstName = firstName;
      if (lastName) updatedUser.lastName = lastName;
      if (email) updatedUser.email = email;
      if (phone !== undefined) updatedUser.phone = phone;

      await updatedUser.save();

      const response: ApiResponse<any> = {
        success: true,
        data: {
          id: updatedUser._id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          role: updatedUser.role
        },
        message: 'Profile updated successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Profile update error:', error);
      next(error);
    }
  };

  /**
   * Change password
   */
  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user._id;
      const { currentPassword, newPassword } = req.body;

      await AuthService.updatePassword(userId, currentPassword, newPassword);

      const response: ApiResponse<any> = {
        success: true,
        message: 'Password changed successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}