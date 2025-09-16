import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
const notificationController = new NotificationController();

// Get user notifications with pagination and filtering
router.get(
  '/',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isIn(['info', 'warning', 'error', 'success']).withMessage('Invalid notification type'),
    query('unreadOnly').optional().isBoolean().withMessage('unreadOnly must be a boolean')
  ],
  validateRequest,
  notificationController.getUserNotifications
);

// Get unread notification count
router.get(
  '/unread-count',
  authenticateToken,
  notificationController.getUnreadCount
);

// Get notification by ID
router.get(
  '/:id',
  authenticateToken,
  [
    param('id').isMongoId().withMessage('Invalid notification ID')
  ],
  validateRequest,
  notificationController.getNotificationById
);

// Mark notification as read
router.patch(
  '/:id/read',
  authenticateToken,
  [
    param('id').isMongoId().withMessage('Invalid notification ID')
  ],
  validateRequest,
  notificationController.markAsRead
);

// Mark all notifications as read
router.patch(
  '/mark-all-read',
  authenticateToken,
  notificationController.markAllAsRead
);

// Delete notification
router.delete(
  '/:id',
  authenticateToken,
  [
    param('id').isMongoId().withMessage('Invalid notification ID')
  ],
  validateRequest,
  notificationController.deleteNotification
);

// Create notification (admin/manager only)
router.post(
  '/',
  authenticateToken,
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
    body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 1000 }).withMessage('Message must be less than 1000 characters'),
    body('type').isIn(['info', 'warning', 'error', 'success']).withMessage('Invalid notification type'),
    body('userId').optional().isMongoId().withMessage('Invalid user ID')
  ],
  validateRequest,
  notificationController.createNotification
);

export default router;
