import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createError } from '../middleware/errorHandler';
import { ApiResponse } from '@fleet-management/shared';

interface User {
  id: string;
  email: string;
  name: string;
  password: string;
}

// Mock user database - in production, use a real database
const users: User[] = [
  {
    id: '1',
    email: 'admin@fleet.com',
    name: 'Admin User',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // password
  }
];

export class AuthController {
  
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      
      const user = users.find(u => u.email === email);
      if (!user) {
        const error = createError('Invalid credentials', 401);
        return next(error);
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        const error = createError('Invalid credentials', 401);
        return next(error);
      }
      
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      const response: ApiResponse<any> = {
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        },
        message: 'Login successful'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body;
      
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        const error = createError('User already exists', 400);
        return next(error);
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        password: hashedPassword
      };
      
      users.push(newUser);
      
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      const response: ApiResponse<any> = {
        success: true,
        data: {
          token,
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name
          }
        },
        message: 'Registration successful'
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  
  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // In a real app, you might want to blacklist the token
      const response: ApiResponse<any> = {
        success: true,
        data: null,
        message: 'Logout successful'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // In a real app, you'd get this from the JWT token
      const response: ApiResponse<any> = {
        success: true,
        data: {
          id: '1',
          email: 'admin@fleet.com',
          name: 'Admin User'
        },
        message: 'Current user retrieved'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
