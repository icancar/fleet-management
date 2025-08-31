import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { TripController } from '../controllers/TripController';

const router = Router();
const tripController = new TripController();

const validateTrip = [
  body('vehicleId').isString().notEmpty().withMessage('Vehicle ID is required'),
  body('driverId').isString().notEmpty().withMessage('Driver ID is required'),
  body('startLocation').isString().notEmpty().withMessage('Start location is required'),
  body('endLocation').isString().notEmpty().withMessage('End location is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  validateRequest
];

router.get('/', tripController.getAllTrips);
router.get('/:id', tripController.getTripById);
router.post('/', validateTrip, tripController.createTrip);
router.put('/:id', validateTrip, tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);

export { router as tripRoutes };
