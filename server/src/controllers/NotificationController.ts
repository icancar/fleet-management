import { Request, Response, NextFunction } from 'express';
import { Notification, INotification } from '../models/Notification';
import { ApiResponse } from '@fleet-management/shared';
import { createError } from '../middleware/errorHandler';
import { NotificationService } from '../services/NotificationService';

export class NotificationController {
  
  // Get all notifications for the current user
  getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;
      const { page = 1, limit = 20, type, unreadOnly } = req.query;
      
      const query: any = { userId: currentUser._id };
      
      if (type) {
        query.type = type;
      }
      
      if (unreadOnly === 'true') {
        query.isRead = false;
      }
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email');
      
      const total = await Notification.countDocuments(query);
      
      const response: ApiResponse<{
        notifications: INotification[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }> = {
        success: true,
        data: {
          notifications,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        },
        message: 'Notifications retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get unread notification count
  getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;
      
      const unreadCount = await Notification.getUnreadCount(currentUser._id);
      
      const response: ApiResponse<{ count: number }> = {
        success: true,
        data: { count: unreadCount },
        message: 'Unread count retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // Mark notification as read
  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;
      
      const notification = await Notification.findOne({
        _id: id,
        userId: currentUser._id
      });
      
      if (!notification) {
        const error = createError('Notification not found', 404);
        return next(error);
      }
      
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
      
      const response: ApiResponse<INotification> = {
        success: true,
        data: notification,
        message: 'Notification marked as read'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // Mark all notifications as read
  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;
      
      await Notification.updateMany(
        { userId: currentUser._id, isRead: false },
        { 
          isRead: true, 
          readAt: new Date() 
        }
      );
      
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'All notifications marked as read'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // Delete notification
  deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;
      
      const notification = await Notification.findOneAndDelete({
        _id: id,
        userId: currentUser._id
      });
      
      if (!notification) {
        const error = createError('Notification not found', 404);
        return next(error);
      }
      
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Notification deleted successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // Create notification (admin/manager only)
  createNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;
      const { title, message, type, userId } = req.body;
      
      // Check if user has permission to create notifications
      if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
        const error = createError('Insufficient permissions', 403);
        return next(error);
      }
      
      if (userId) {
        // Send to specific user
        const notification = await NotificationService.sendPushNotification(
          userId,
          title,
          message,
          type
        );
        
        const response: ApiResponse<INotification> = {
          success: true,
          data: notification,
          message: 'Notification sent successfully'
        };
        
        res.status(201).json(response);
      } else {
        // Send to all drivers in the company
        const notifications = await NotificationService.sendPushNotificationToCompany(
          currentUser.companyId,
          title,
          message,
          type
        );
        
        const response: ApiResponse<INotification[]> = {
          success: true,
          data: notifications,
          message: `Notification sent to ${notifications.length} driver(s)`
        };
        
        res.status(201).json(response);
      }
    } catch (error) {
      next(error);
    }
  };

  // Get notification by ID
  getNotificationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;
      
      const notification = await Notification.findOne({
        _id: id,
        userId: currentUser._id
      }).populate('userId', 'name email')
        .populate('companyId', 'name');
      
      if (!notification) {
        const error = createError('Notification not found', 404);
        return next(error);
      }
      
      const response: ApiResponse<INotification> = {
        success: true,
        data: notification,
        message: 'Notification retrieved successfully'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

}
