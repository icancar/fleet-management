import { Router } from 'express';
import { VehicleDataController } from '../controllers/VehicleDataController';

const router = Router();
const vehicleDataController = new VehicleDataController();

// Public routes for vehicle data (no authentication required)
router.get('/brands', vehicleDataController.getVehicleBrands);
router.get('/models/:brand', vehicleDataController.getVehicleModels);
router.get('/data', vehicleDataController.getVehicleData);

export { router as vehicleDataRoutes };
