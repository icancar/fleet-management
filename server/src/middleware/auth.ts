import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User, UserRole } from '../models/User';

// Load environment variables
dotenv.config();

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return res.status(403).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    if (!decoded.userId) {
      return res.status(403).json({
        success: false,
        message: 'Invalid token payload'
      });
    }

    let user;
    try {
      user = await User.findById(decoded.userId).select('-password');
    } catch (dbError) {
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requireManager = requireRole([UserRole.MANAGER, UserRole.ADMIN]);
export const requireDriver = requireRole([UserRole.DRIVER, UserRole.MANAGER, UserRole.ADMIN]);
