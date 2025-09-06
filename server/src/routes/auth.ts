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

const validateCompanyOwner = [
  body('company.name').isLength({ min: 2 }).withMessage('Company name is required'),
  body('owner.email').isEmail().withMessage('Valid email is required'),
  body('owner.password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('owner.firstName').isLength({ min: 2 }).withMessage('First name is required'),
  body('owner.lastName').isLength({ min: 2 }).withMessage('Last name is required'),
  validateRequest
];

const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validateRequest
];

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/create-company', validateCompanyOwner, authController.createCompanyWithOwner);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/change-password', authenticateToken, validatePasswordChange, authController.changePassword);

export { router as authRoutes };