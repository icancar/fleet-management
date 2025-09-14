import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AdminRoutesController } from '../controllers/AdminRoutesController';

const router = Router();
const adminRoutesController = new AdminRoutesController();

// All routes require authentication
router.use(authenticateToken);

// GET /api/admin-routes/drivers/summary - Get all drivers with route summary
router.get('/drivers/summary', adminRoutesController.getDriversSummary);

// GET /api/admin-routes/drivers/:driverId/routes - Get detailed routes for specific driver
router.get('/drivers/:driverId/routes', adminRoutesController.getDriverRoutes);

export { router as adminRoutesRoutes };
