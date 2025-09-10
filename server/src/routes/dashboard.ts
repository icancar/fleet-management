import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { DashboardController } from '../controllers/DashboardController';

const router = Router();
const dashboardController = new DashboardController();

// All routes require authentication
router.use(authenticateToken);

router.get('/stats', dashboardController.getDashboardStats);

export { router as dashboardRoutes };
