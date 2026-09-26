import { Router } from 'express';
import { procurementController } from '../controllers/procurementController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validate';
import { updateProcurementStatusSchema } from '../schemas/procurement.schema';
import { UserRole } from '../../../shared/types';

const router = Router();

// GET /api/procurement/current - Active procurement for farmer
router.get('/current', authenticateToken, asyncHandler((req, res) => procurementController.getCurrent(req, res)));

// GET /api/procurement/history - Procurement history for farmer
router.get('/history', authenticateToken, asyncHandler((req, res) => procurementController.getHistory(req, res)));

// GET /api/procurement - List all procurements (Officer / Admin)
router.get('/', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), asyncHandler((req, res) => procurementController.getAll(req, res)));

// GET /api/procurement/:id - Single procurement details
router.get('/:id', authenticateToken, asyncHandler((req, res) => procurementController.getById(req, res)));

// PUT /api/procurement/:id/status - State machine lifecycle status progression
router.put('/:id/status', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), validateBody(updateProcurementStatusSchema), asyncHandler((req, res) => procurementController.updateStatus(req, res)));

export default router;
