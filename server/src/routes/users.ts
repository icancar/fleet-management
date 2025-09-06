import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, requireManager, requireCompanyOwner } from '../middleware/auth';
import { UserController } from '../controllers/UserController';
import { UserRole } from '../models/User';

const router = Router();
const userController = new UserController();

// Validation middleware
const validateUser = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('role').isIn(Object.values(UserRole)).withMessage('Invalid role'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number is required'),
  validateRequest
];

// All routes require authentication
router.use(authenticateToken);

// Get all users (role-based access)
router.get('/', userController.getAllUsers);

// Get user by ID
router.get('/:userId', userController.getUserById);

// Create new user (Manager or Company Owner only)
router.post('/', requireManager, validateUser, userController.createUser);

// Update user
router.put('/:userId', userController.updateUser);

// Delete user (soft delete)
router.delete('/:userId', requireManager, userController.deleteUser);

// Get user's devices
router.get('/:userId/devices', userController.getUserDevices);

// Get user's location data
router.get('/:userId/locations', userController.getUserLocationData);

export { router as userRoutes };
