import { Router } from 'express';
import { authenticateToken, requireManager } from '../middleware/auth';
import { ManagerRoutesController } from '../controllers/ManagerRoutesController';

const router = Router();
const managerRoutesController = new ManagerRoutesController();

// GET /api/manager-routes/drivers - Get all drivers managed by the current manager
router.get('/drivers', authenticateToken, requireManager, managerRoutesController.getManagedDrivers);

// GET /api/manager-routes/drivers/summary - Get all drivers with route summary for a specific date
router.get('/drivers/summary', authenticateToken, requireManager, managerRoutesController.getDriversWithRouteSummary);

// GET /api/manager-routes/drivers/:driverId/routes - Get routes for a specific driver
router.get('/drivers/:driverId/routes', authenticateToken, requireManager, managerRoutesController.getDriverRoutes);

export { router as managerRoutesRoutes };
