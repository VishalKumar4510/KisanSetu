import { Router } from 'express';
import { officerController } from '../controllers/officerController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validate';
import { UserRole } from '../../../shared/types';
import {
  callFarmerSchema,
  pauseQueueSchema,
  resumeQueueSchema,
  weighmentSchema,
  qualitySchema,
  procurementIdSchema,
  paymentProcessSchema,
} from '../schemas/officer.schema';

const router = Router();

// 1. Stats & Queue Operations
router.get('/stats', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), asyncHandler((req, res) => officerController.getStats(req, res)));
router.get('/queue', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), asyncHandler((req, res) => officerController.getQueue(req, res)));
router.post('/queue/pause', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), validateBody(pauseQueueSchema), asyncHandler((req, res) => officerController.pauseQueue(req, res)));
router.post('/queue/resume', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), validateBody(resumeQueueSchema), asyncHandler((req, res) => officerController.resumeQueue(req, res)));

// 2. Desk Operations: Call & Current Farmer
router.get('/current-farmer', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), asyncHandler((req, res) => officerController.getCurrentFarmer(req, res)));
router.post('/call', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), validateBody(callFarmerSchema), asyncHandler((req, res) => officerController.callFarmer(req, res)));

// 3. Physical Intake: Weighment & Agmarknet Quality Assessment
router.post('/weighment', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), validateBody(weighmentSchema), asyncHandler((req, res) => officerController.submitWeighment(req, res)));
router.post('/quality', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), validateBody(qualitySchema), asyncHandler((req, res) => officerController.submitQuality(req, res)));

// 4. MSP Calculations & DBT Payment Processing
router.post('/calculate', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), validateBody(procurementIdSchema), asyncHandler((req, res) => officerController.calculate(req, res)));
router.post('/payment/review', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), validateBody(procurementIdSchema), asyncHandler((req, res) => officerController.reviewPayment(req, res)));
router.post('/payment/initiate', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), validateBody(procurementIdSchema), asyncHandler((req, res) => officerController.initiatePayment(req, res)));
router.post('/payment/process', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), validateBody(paymentProcessSchema), asyncHandler((req, res) => officerController.processPayment(req, res)));

// 5. Procurement History, Receipts & Settlements
router.get('/payments', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), asyncHandler((req, res) => officerController.getPayments(req, res)));
router.get('/procurement/:id/receipt', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), asyncHandler((req, res) => officerController.getReceipt(req, res)));
router.get('/farmers/:farmerId/history', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), asyncHandler((req, res) => officerController.getFarmerHistory(req, res)));

// 6. Alerts, Daily Settlement & Equipment Calibration
router.get('/alerts', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), asyncHandler((req, res) => officerController.getAlerts(req, res)));
router.patch('/alerts/:id/read', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), asyncHandler((req, res) => officerController.markAlertRead(req, res)));
router.get('/settlement', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), asyncHandler((req, res) => officerController.getDailySettlement(req, res)));
router.get('/scales', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), asyncHandler((req, res) => officerController.getScales(req, res)));
router.patch('/scales/:id', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), asyncHandler((req, res) => officerController.updateScale(req, res)));

export default router;
