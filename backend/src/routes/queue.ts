import { Router } from 'express';
import { queueController } from '../controllers/queueController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validate';
import { resumeQueueSchema } from '../schemas/officer.schema';
import { UserRole } from '../../../shared/types';

const router = Router();

// GET /api/queue/centre/:centreId - Live Mandi queue
router.get('/centre/:centreId', authenticateToken, asyncHandler((req, res) => queueController.getQueueByCentre(req, res)));

// GET /api/queue/position - Farmer queue position & ETA
router.get('/position', authenticateToken, asyncHandler((req, res) => queueController.getQueuePosition(req, res)));

// POST /api/queue/next - Officer calls next token in queue
router.post('/next', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), validateBody(resumeQueueSchema), asyncHandler((req, res) => queueController.callNext(req, res)));

export default router;
