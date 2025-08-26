import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { VehicleController } from '../controllers/VehicleController';

const router = Router();
const vehicleController = new VehicleController();

// Validation middleware
const validateVehicle = [
  body('licensePlate').trim().isLength({ min: 1 }).withMessage('License plate is required'),
  body('make').trim().isLength({ min: 1 }).withMessage('Make is required'),
  body('model').trim().isLength({ min: 1 }).withMessage('Model is required'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
  body('vin').trim().isLength({ min: 17, max: 17 }).withMessage('VIN must be 17 characters'),
  body('fuelType').isIn(['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']).withMessage('Invalid fuel type'),
  body('status').isIn(['active', 'maintenance', 'out_of_service', 'retired']).withMessage('Invalid status'),
  body('currentMileage').isFloat({ min: 0 }).withMessage('Current mileage must be positive'),
  validateRequest
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['licensePlate', 'make', 'model', 'year', 'status', 'currentMileage', 'createdAt']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  validateRequest
];

// GET /api/vehicles - Get all vehicles with pagination and filtering
router.get('/', validatePagination, vehicleController.getAllVehicles);

// GET /api/vehicles/:id - Get vehicle by ID
router.get('/:id', 
  param('id').isUUID().withMessage('Invalid vehicle ID'),
  validateRequest,
  vehicleController.getVehicleById
);

// POST /api/vehicles - Create new vehicle
router.post('/', validateVehicle, vehicleController.createVehicle);

// PUT /api/vehicles/:id - Update vehicle
router.put('/:id',
  param('id').isUUID().withMessage('Invalid vehicle ID'),
  ...validateVehicle,
  vehicleController.updateVehicle
);

// DELETE /api/vehicles/:id - Delete vehicle
router.delete('/:id',
  param('id').isUUID().withMessage('Invalid vehicle ID'),
  validateRequest,
  vehicleController.deleteVehicle
);

// GET /api/vehicles/:id/maintenance - Get maintenance history for vehicle
router.get('/:id/maintenance',
  param('id').isUUID().withMessage('Invalid vehicle ID'),
  validatePagination,
  vehicleController.getVehicleMaintenance
);

// GET /api/vehicles/:id/trips - Get trip history for vehicle
router.get('/:id/trips',
  param('id').isUUID().withMessage('Invalid vehicle ID'),
  validatePagination,
  vehicleController.getVehicleTrips
);

// GET /api/vehicles/:id/fuel - Get fuel records for vehicle
router.get('/:id/fuel',
  param('id').isUUID().withMessage('Invalid vehicle ID'),
  validatePagination,
  vehicleController.getVehicleFuelRecords
);

export { router as vehicleRoutes };
