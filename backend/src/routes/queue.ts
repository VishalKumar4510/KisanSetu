import { Router } from 'express';
import store from '../data/store';
import { authenticateToken, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { UserRole } from '../../../shared/types';

const router = Router();

// GET /api/queue/centre/:centreId
router.get('/centre/:centreId', authenticateToken, asyncHandler(async (req, res) => {
  const queue = store.getQueueByCentre(req.params.centreId);
  const enriched = queue.map(token => {
    const farmer = store.getFarmerById(token.farmerId);
    const procurement = store.getProcurementByFarmer(token.farmerId).find(p => p.tokenId === token.id);
    const produce = procurement?.produceId ? store.getProduceById(procurement.produceId) : null;
    return {
      ...token,
      farmerName: farmer?.name || 'Unknown',
      farmerId: farmer?.farmerId || '',
      produce: produce?.type || '',
      quantity: produce ? `${produce.quantity} ${produce.unit}` : '',
      procurementStatus: procurement?.status || '',
    };
  });
  return res.json({ success: true, data: enriched });
}));

// GET /api/queue/position
router.get('/position', authenticateToken, asyncHandler(async (req, res) => {
  const farmerId = (req.query.farmerId as string) || req.user!.id;
  const token = store.getActiveTokenByFarmer(farmerId);
  if (!token) return res.json({ success: true, data: null });

  const centre = store.getCentreById(token.centreId);
  const queue = store.getQueueByCentre(token.centreId);
  const position = queue.findIndex(t => t.id === token.id) + 1;
  const etaMinutes = Math.round(position * 15 / Math.max(centre?.activeBays || 1, 1));

  return res.json({
    success: true,
    data: {
      position,
      totalInQueue: queue.length,
      estimatedTime: `${etaMinutes}`,
      centreId: token.centreId,
      centreName: centre?.name || '',
      tokenNumber: token.tokenNumber,
      tokenId: token.id,
    },
  });
}));

// POST /api/queue/next - officer calls next in queue
router.post('/next', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), asyncHandler(async (req, res) => {
  const { centreId } = req.body;
  if (!centreId) return res.status(400).json({ success: false, error: 'centreId required' });
  const queue = store.getQueueByCentre(centreId);
  if (queue.length === 0) return res.json({ success: true, data: null, message: 'Queue is empty' });
  const nextToken = queue[0];
  store.updateToken(nextToken.id, { status: 'USED' });
  // Recalculate positions
  queue.slice(1).forEach((t, i) => store.updateToken(t.id, { queuePosition: i + 1 }));
  const farmer = store.getFarmerById(nextToken.farmerId);
  return res.json({ success: true, data: { token: nextToken, farmerName: farmer?.name } });
}));

export default router;
