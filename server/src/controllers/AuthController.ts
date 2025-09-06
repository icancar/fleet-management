import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRole } from '../models/User';
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
   * Create company with owner
   */
  createCompanyWithOwner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { company, owner } = req.body;

      const result = await AuthService.createCompanyWithOwner(company, owner);

      const response: ApiResponse<any> = {
        success: true,
        data: result,
        message: 'Company and owner created successfully'
      };

      res.status(201).json(response);
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
   * Update user profile
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user._id;
      const { firstName, lastName, phone } = req.body;

      // Update user profile (excluding sensitive fields)
      const updatedUser = await AuthService.getUserById(userId);
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update allowed fields
      if (firstName) updatedUser.firstName = firstName;
      if (lastName) updatedUser.lastName = lastName;
      if (phone !== undefined) updatedUser.phone = phone;

      await updatedUser.save();

      const response: ApiResponse<any> = {
        success: true,
        data: updatedUser.toJSON(),
        message: 'Profile updated successfully'
      };

      res.json(response);
    } catch (error) {
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