import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { AuthController } from '../controllers/AuthController';
import { UserRole } from '../models/User';

const router = Router();
const authController = new AuthController();

// Validation middleware
const validateRegister = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('role').optional().isIn(Object.values(UserRole)).withMessage('Invalid role'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number is required'),
  validateRequest
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];


const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match new password');
    }
    return true;
  }),
  validateRequest
];

const validateProfileUpdate = [
  body('firstName').optional().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').optional().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().custom((value) => {
    if (value && value !== '' && !/^[\+]?[1-9][\d]{0,15}$/.test(value)) {
      throw new Error('Please enter a valid phone number (numbers only, optional + at start)');
    }
    return true;
  }),
  validateRequest
];

const validateFCMToken = [
  body('fcmToken').notEmpty().withMessage('FCM token is required'),
  validateRequest
];

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Protected routes
router.get('/me', authenticateToken, authController.getMe);
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, validateProfileUpdate, authController.updateProfile);
router.put('/change-password', authenticateToken, validatePasswordChange, authController.changePassword);
router.post('/fcm-token', authenticateToken, validateFCMToken, authController.registerFCMToken);

export { router as authRoutes };