import { Router } from 'express';
import store from '../data/store';
import { centreRepository, tokenRepository, procurementRepository, slotRepository } from '../repositories';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { CongestionLevel } from '../../../shared/types';

const router = Router();

async function computeCentreStats(centreId: string) {
  const centre = (await centreRepository.findById(centreId)) || store.getCentreById(centreId);
  if (!centre) return null;

  const dbTokens = await tokenRepository.findActiveByCentreId(centreId);
  const queue = dbTokens.length > 0 ? dbTokens : store.getQueueByCentre(centreId);

  const dbProcs = await procurementRepository.findByCentreId(centreId);
  const procs = dbProcs.length > 0 ? dbProcs : store.getProcurementsByCentre(centreId);

  const today = new Date().toISOString().split('T')[0];
  const completedToday = procs.filter(
    (p) => p.status === 'COMPLETED' && p.completedAt?.startsWith(today)
  ).length;

  const avgWait = queue.length > 0 ? Math.round((queue.length * 15) / Math.max(centre.activeBays, 1)) : 0;
  const utilization = Math.min(100, Math.round((queue.length / Math.max(centre.capacity * 0.1, 1)) * 100));

  let congestionLevel: CongestionLevel = CongestionLevel.GREEN;
  if (utilization > 80) congestionLevel = CongestionLevel.RED;
  else if (utilization > 50) congestionLevel = CongestionLevel.YELLOW;

  await centreRepository.updateCentre(centreId, { congestionLevel }).catch(() => null);
  store.updateCentre(centreId, { congestionLevel });

  return {
    centreId,
    centreName: centre.name,
    queueLength: queue.length,
    avgWaitTime: avgWait,
    utilization,
    activeFarmers: queue.length,
    completedToday,
    congestionLevel,
  };
}

// GET /api/centres
router.get('/', optionalAuth, asyncHandler(async (_req, res) => {
  const dbCentres = await centreRepository.getAllCentres();
  const centresList = dbCentres.length > 0 ? dbCentres : store.getAllCentres();

  const centresWithStats = await Promise.all(
    centresList.map(async (c) => {
      const stats = await computeCentreStats(c.id);
      const dbSlots = await slotRepository.getAvailableSlots(c.id);
      const availableSlots = dbSlots.length > 0 ? dbSlots.length : store.getSlotsByCentre(c.id).filter(s => s.status === 'AVAILABLE').length;
      return { ...c, stats, availableSlots };
    })
  );

  return res.json({ success: true, data: centresWithStats });
}));

// GET /api/centres/:id
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const centre = (await centreRepository.findById(req.params.id)) || store.getCentreById(req.params.id);
  if (!centre) return res.status(404).json({ success: false, error: 'Centre not found' });

  const stats = await computeCentreStats(req.params.id);
  const dbSlots = await slotRepository.getAvailableSlots(req.params.id);
  const slots = dbSlots.length > 0 ? dbSlots : store.getSlotsByCentre(req.params.id);

  return res.json({ success: true, data: { ...centre, stats, slots } });
}));

// GET /api/centres/:id/stats
router.get('/:id/stats', optionalAuth, asyncHandler(async (req, res) => {
  const stats = await computeCentreStats(req.params.id);
  if (!stats) return res.status(404).json({ success: false, error: 'Centre not found' });
  return res.json({ success: true, data: stats });
}));

export default router;
