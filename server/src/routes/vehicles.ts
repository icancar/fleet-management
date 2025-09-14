import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, requireManager, requireAdmin } from '../middleware/auth';
import { VehicleController } from '../controllers/VehicleController';

const router = Router();
const vehicleController = new VehicleController();

const validateVehicle = [
  body('licensePlate').isLength({ min: 2 }).withMessage('License plate is required'),
  body('make').isLength({ min: 2 }).withMessage('Make is required'),
  body('model').isLength({ min: 2 }).withMessage('Model is required'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),
  body('vin').isLength({ min: 17, max: 17 }).withMessage('VIN must be 17 characters'),
  body('nextServiceDate').isISO8601().withMessage('Valid service date is required'),
  body('odometer').isInt({ min: 0 }).withMessage('Odometer must be a positive number'),
  body('driverId').optional().custom((value) => {
    // Allow empty string, null, or undefined (unassigned vehicle)
    if (value === '' || value === null || value === undefined) return true;
    // If a value is provided, it must be a valid MongoDB ObjectId
    return /^[0-9a-fA-F]{24}$/.test(value);
  }).withMessage('Valid driver ID is required'),
  validateRequest
];

const validateVehicleUpdate = [
  body('licensePlate').optional().isLength({ min: 2 }).withMessage('License plate must be at least 2 characters'),
  body('make').optional().isLength({ min: 2 }).withMessage('Make must be at least 2 characters'),
  body('model').optional().isLength({ min: 2 }).withMessage('Model must be at least 2 characters'),
  body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),
  body('vin').optional().isLength({ min: 17, max: 17 }).withMessage('VIN must be 17 characters'),
  body('nextServiceDate').optional().isISO8601().withMessage('Valid service date is required'),
  body('odometer').optional().isInt({ min: 0 }).withMessage('Odometer must be a positive number'),
  body('status').optional().isIn(['active', 'maintenance', 'out_of_service']).withMessage('Invalid status'),
  body('driverId').optional().custom((value) => {
    // Allow empty string, null, or undefined (unassigned vehicle)
    if (value === '' || value === null || value === undefined) return true;
    // If a value is provided, it must be a valid MongoDB ObjectId
    return /^[0-9a-fA-F]{24}$/.test(value);
  }).withMessage('Valid driver ID is required'),
  validateRequest
];

// All routes require authentication
router.use(authenticateToken);

// Get all vehicles (role-based access)
router.get('/', vehicleController.getAllVehicles);

// Get available drivers for assignment
router.get('/available-drivers', vehicleController.getAvailableDrivers);

// Get vehicle by ID
router.get('/:id', vehicleController.getVehicleById);

// Create new vehicle (Manager or Admin only)
router.post('/', requireManager, validateVehicle, vehicleController.createVehicle);

// Update vehicle
router.put('/:id', validateVehicleUpdate, vehicleController.updateVehicle);

// Mark service as done (extends service date by 1 year)
router.patch('/:id/service-done', requireManager, vehicleController.markServiceDone);

// Delete vehicle (soft delete)
router.delete('/:id', requireManager, vehicleController.deleteVehicle);

// Activate vehicle (change status from out_of_service to active)
router.patch('/:id/activate', requireManager, vehicleController.activateVehicle);

// Hard delete vehicle (permanently remove from database - Manager or Admin)
router.delete('/:id/permanent', requireManager, vehicleController.hardDeleteVehicle);

export { router as vehicleRoutes };