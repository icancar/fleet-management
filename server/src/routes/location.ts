import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { LocationController } from '../controllers/LocationController';

const router = Router();
const locationController = new LocationController();

// Validation middleware
const validateLocationData = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('accuracy').isFloat({ min: 0 }).withMessage('Accuracy must be positive'),
  body('timestamp').isISO8601().withMessage('Invalid timestamp'),
  body('speed').isFloat({ min: 0 }).optional().withMessage('Speed must be positive'),
  body('bearing').isFloat({ min: 0, max: 360 }).optional().withMessage('Bearing must be between 0-360'),
  body('altitude').isFloat().optional().withMessage('Invalid altitude'),
  body('deviceId').isString().notEmpty().withMessage('Device ID is required'),
  validateRequest
];

// POST /api/location - Receive location data from mobile app
router.post('/', validateLocationData, locationController.receiveLocation);

// GET /api/location - Get location history (optional, for debugging)
router.get('/', locationController.getLocationHistory);

// GET /api/location/:deviceId - Get location history for specific device
router.get('/:deviceId', locationController.getDeviceLocationHistory);

export { router as locationRoutes };
