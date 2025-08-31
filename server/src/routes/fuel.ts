import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { FuelController } from '../controllers/FuelController';

const router = Router();
const fuelController = new FuelController();

const validateFuel = [
  body('vehicleId').isString().notEmpty().withMessage('Vehicle ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('cost').isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
  body('date').isISO8601().withMessage('Valid date is required'),
  validateRequest
];

router.get('/', fuelController.getAllFuelRecords);
router.get('/:id', fuelController.getFuelRecordById);
router.post('/', validateFuel, fuelController.createFuelRecord);
router.put('/:id', validateFuel, fuelController.updateFuelRecord);
router.delete('/:id', fuelController.deleteFuelRecord);

export { router as fuelRoutes };
