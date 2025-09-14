import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, requireDriver } from '../middleware/auth';
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

// NEW ROUTE ENDPOINTS FOR ROUTE VISUALIZATION

// GET /api/location/routes/all - Get all daily routes for all devices
router.get('/routes/all', locationController.getAllDailyRoutes);

// GET /api/location/routes/device/:deviceId - Get daily routes for specific device
router.get('/routes/device/:deviceId', locationController.getDeviceDailyRoutes);

// GET /api/location/routes/my - Get current user's routes (with access control)
router.get('/routes/my', authenticateToken, requireDriver, locationController.getLocationDataWithAccessControl);

// GET /api/location/routes/stats/:deviceId - Get route statistics for specific device
router.get('/routes/stats/:deviceId', locationController.getDeviceRouteStats);

// NEW DEVICE MANAGEMENT ENDPOINTS

// GET /api/location/devices - Get all devices
router.get('/devices', locationController.getAllDevices);

// GET /api/location/devices/:deviceId/stats - Get device statistics
router.get('/devices/:deviceId/stats', locationController.getDeviceStats);

// NEW ODOMETER MANAGEMENT ENDPOINTS

// GET /api/location/odometer/current - Get current odometer reading for user's vehicle
router.get('/odometer/current', authenticateToken, locationController.getCurrentOdometer);

// POST /api/location/odometer/set - Set odometer reading (admin/manager only)
router.post('/odometer/set', authenticateToken, locationController.setOdometer);

export { router as locationRoutes };
