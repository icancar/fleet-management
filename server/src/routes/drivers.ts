import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { DriverController } from '../controllers/DriverController';

const router = Router();
const driverController = new DriverController();

const validateDriver = [
  body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('licenseNumber').isLength({ min: 5 }).withMessage('License number must be at least 5 characters'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  validateRequest
];

router.get('/', driverController.getAllDrivers);
router.get('/:id', driverController.getDriverById);
router.post('/', validateDriver, driverController.createDriver);
router.put('/:id', validateDriver, driverController.updateDriver);
router.delete('/:id', driverController.deleteDriver);

export { router as driverRoutes };
