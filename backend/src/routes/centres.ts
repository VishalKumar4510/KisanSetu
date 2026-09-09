import { Router } from 'express';
import store from '../data/store';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { CongestionLevel } from '../../../shared/types';

const router = Router();

function computeCentreStats(centreId: string) {
  const centre = store.getCentreById(centreId);
  if (!centre) return null;
  const queue = store.getQueueByCentre(centreId);
  const procs = store.getProcurementsByCentre(centreId);
  const today = new Date().toISOString().split('T')[0];
  const completedToday = procs.filter(p => p.status === 'COMPLETED' && p.completedAt?.startsWith(today)).length;
  const avgWait = queue.length > 0 ? Math.round(queue.length * 15 / Math.max(centre.activeBays, 1)) : 0;
  const utilization = Math.min(100, Math.round((queue.length / Math.max(centre.capacity * 0.1, 1)) * 100));
  let congestionLevel: CongestionLevel = CongestionLevel.GREEN;
  if (utilization > 80) congestionLevel = CongestionLevel.RED;
  else if (utilization > 50) congestionLevel = CongestionLevel.YELLOW;
  store.updateCentre(centreId, { congestionLevel });
  return {
    centreId, centreName: centre.name, queueLength: queue.length,
    avgWaitTime: avgWait, utilization, activeFarmers: queue.length,
    completedToday, congestionLevel,
  };
}

// GET /api/centres
router.get('/', optionalAuth, asyncHandler(async (_req, res) => {
  const centres = store.getAllCentres().map(c => {
    const stats = computeCentreStats(c.id);
    const slots = store.getSlotsByCentre(c.id).filter(s => s.status === 'AVAILABLE');
    return { ...c, stats, availableSlots: slots.length };
  });
  return res.json({ success: true, data: centres });
}));

// GET /api/centres/:id
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const centre = store.getCentreById(req.params.id);
  if (!centre) return res.status(404).json({ success: false, error: 'Centre not found' });
  const stats = computeCentreStats(req.params.id);
  const slots = store.getSlotsByCentre(req.params.id);
  return res.json({ success: true, data: { ...centre, stats, slots } });
}));

// GET /api/centres/:id/stats
router.get('/:id/stats', optionalAuth, asyncHandler(async (req, res) => {
  const stats = computeCentreStats(req.params.id);
  if (!stats) return res.status(404).json({ success: false, error: 'Centre not found' });
  return res.json({ success: true, data: stats });
}));

export default router;
