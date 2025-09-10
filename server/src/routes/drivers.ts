import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, requireManager, requireAdmin } from '../middleware/auth';
import { DriverController } from '../controllers/DriverController';

const router = Router();
const driverController = new DriverController();

const validateDriver = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number is required'),
  validateRequest
];

const validateDriverUpdate = [
  body('firstName').optional().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').optional().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('phone').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    return /^[\+]?[1-9][\d]{0,15}$/.test(value);
  }).withMessage('Valid phone number is required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  validateRequest
];

// All routes require authentication
router.use(authenticateToken);

// Get all drivers (role-based access)
router.get('/', driverController.getAllDrivers);

// Get all employees (managers + drivers) - Admin only
router.get('/employees', driverController.getAllEmployees);

// Get driver by ID
router.get('/:id', driverController.getDriverById);

// Create new driver (Manager or Admin only)
router.post('/', requireManager, validateDriver, driverController.createDriver);

// Update driver
router.put('/:id', validateDriverUpdate, driverController.updateDriver);

// Delete driver (soft delete)
router.delete('/:id', requireManager, driverController.deleteDriver);

// Manager management routes (Admin only)
router.post('/managers', requireAdmin, validateDriver, driverController.createManager);
router.put('/managers/:id', requireAdmin, validateDriverUpdate, driverController.updateManager);
router.delete('/managers/:id', requireAdmin, driverController.deleteManager);

export { router as driverRoutes };
