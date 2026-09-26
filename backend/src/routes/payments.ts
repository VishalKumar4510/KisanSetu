import { Router } from 'express';
import { paymentController } from '../controllers/paymentController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { UserRole } from '../../../shared/types';

const router = Router();

// GET /api/payments/current - Current active payment for farmer
router.get('/current', authenticateToken, asyncHandler((req, res) => paymentController.getCurrent(req, res)));

// GET /api/payments/history - Payment disbursement history for farmer
router.get('/history', authenticateToken, asyncHandler((req, res) => paymentController.getHistory(req, res)));

// GET /api/payments - List all payments across centres (Admin / Officer)
router.get('/', authenticateToken, requireRole(UserRole.ADMIN, UserRole.OFFICER), asyncHandler((req, res) => paymentController.getAll(req, res)));

// PUT /api/payments/:id/process - Administrative DBT payment settlement
router.put('/:id/process', authenticateToken, requireRole(UserRole.ADMIN), asyncHandler((req, res) => paymentController.processPayment(req, res)));

export default router;
