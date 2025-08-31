import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { MaintenanceController } from '../controllers/MaintenanceController';

const router = Router();
const maintenanceController = new MaintenanceController();

const validateMaintenance = [
  body('vehicleId').isString().notEmpty().withMessage('Vehicle ID is required'),
  body('type').isIn(['REPAIR', 'SERVICE', 'INSPECTION']).withMessage('Valid maintenance type is required'),
  body('description').isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('cost').isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
  validateRequest
];

router.get('/', maintenanceController.getAllMaintenance);
router.get('/:id', maintenanceController.getMaintenanceById);
router.post('/', validateMaintenance, maintenanceController.createMaintenance);
router.put('/:id', validateMaintenance, maintenanceController.updateMaintenance);
router.delete('/:id', maintenanceController.deleteMaintenance);

export { router as maintenanceRoutes };
