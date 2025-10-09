import { Router } from 'express';
import { body, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { ReportsController } from '../controllers/ReportsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const reportsController = new ReportsController();

// Validation middleware
const validateMileageReport = [
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('reportType').isIn(['daily', 'weekly', 'yearly']).withMessage('Report type must be daily, weekly, or yearly'),
  body('driverIds').optional().isArray().withMessage('Driver IDs must be an array'),
  body('driverIds.*').optional().isMongoId().withMessage('Invalid driver ID format'),
  body('format').optional().isIn(['json', 'pdf']).withMessage('Format must be json or pdf'),
  validateRequest
];

// Routes
router.get('/test', reportsController.testReports);
router.get('/test-pdf', reportsController.testPDF);
router.get('/drivers', authenticateToken, reportsController.getAvailableDrivers);
router.post('/mileage', authenticateToken, validateMileageReport, reportsController.generateMileageReport);

export default router;
