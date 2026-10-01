import { Router } from 'express';
import store from '../data/store';
import { prisma } from '../lib/prisma';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { KPIData, ProcurementStatus, PaymentStatus, CongestionLevel } from '../../../shared/types';

const router = Router();

// GET /api/analytics/kpis - Uses database count aggregations where practical
router.get('/kpis', optionalAuth, asyncHandler(async (_req, res) => {
  const [farmersCount, activeQueueCount, completedCount, paymentsCompletedCount] = await Promise.all([
    prisma.farmer.count().catch(() => store.getAllFarmers().length),
    prisma.token.count({ where: { status: 'ACTIVE' } }).catch(() => store.getActiveQueueCount()),
    prisma.procurement.count({ where: { status: 'COMPLETED' } }).catch(() => store.getCompletedToday().length),
    prisma.payment.count({ where: { status: 'COMPLETED' } }).catch(() => store.getAllPayments().filter(p => p.status === PaymentStatus.COMPLETED).length),
  ]);

  const kpis: KPIData = {
    farmersRegistered: farmersCount,
    todaysBookings: store.getTodaysBookings(),
    activeQueue: activeQueueCount,
    avgWaitTime: store.getAvgWaitTime(),
    completedProcurement: completedCount,
    paymentsProcessed: paymentsCompletedCount,
  };
  return res.json({ success: true, data: kpis });
}));

// GET /api/analytics/charts/:type
router.get('/charts/:type', optionalAuth, asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { period = '7d' } = req.query;

  let days = 7;
  if (period === 'today') days = 1;
  else if (period === '30d') days = 30;

  const analytics = store.analytics;
  let data: { date: string; value: number }[] = [];

  switch (type) {
    case 'registrations':
      data = analytics.registrations?.slice(-days) || generateMockChart(days, 5, 15);
      break;
    case 'bookings':
      data = analytics.bookings?.slice(-days) || generateMockChart(days, 10, 30);
      break;
    case 'waitTime':
      data = analytics.waitTimes?.slice(-days) || generateMockChart(days, 10, 45);
      break;
    case 'queueLength':
      data = generateMockChart(days, 5, 25);
      break;
    case 'utilization':
      data = generateMockChart(days, 40, 90);
      break;
    case 'procurement':
      data = analytics.procurements?.slice(-days) || generateMockChart(days, 8, 20);
      break;
    case 'payments':
      data = analytics.payments?.slice(-days) || generateMockChart(days, 5, 18);
      break;
    default:
      data = generateMockChart(days, 0, 50);
  }

  return res.json({ success: true, data });
}));

// GET /api/analytics/centre-comparison
router.get('/centre-comparison', optionalAuth, asyncHandler(async (_req, res) => {
  const dbCentres = await prisma.centre.findMany().catch(() => []);
  const centres = dbCentres.length > 0 ? dbCentres : store.getAllCentres();
  const today = new Date().toISOString().split('T')[0];

  const comparison = await Promise.all(centres.map(async (c: any) => {
    const activeTokens = await prisma.token.findMany({ where: { centreId: c.id, status: 'ACTIVE' } }).catch(() => []);
    const queue = activeTokens.length > 0 ? activeTokens : store.getQueueByCentre(c.id);
    const completedCount = await prisma.procurement.count({
      where: {
        centreId: c.id,
        status: 'COMPLETED',
        completedAt: { gte: new Date(today) },
      },
    }).catch(() => store.getProcurementsByCentre(c.id).filter(p => p.status === ProcurementStatus.COMPLETED && p.completedAt?.startsWith(today)).length);

    const utilization = Math.min(100, Math.round((queue.length / Math.max(c.capacity * 0.1, 1)) * 100));
    let congestionLevel: CongestionLevel = CongestionLevel.GREEN;
    if (utilization > 80) congestionLevel = CongestionLevel.RED;
    else if (utilization > 50) congestionLevel = CongestionLevel.YELLOW;
    return {
      centreId: c.id, centreName: c.name,
      queueLength: queue.length,
      avgWaitTime: queue.length > 0 ? Math.round(queue.length * 15 / Math.max(c.activeBays, 1)) : 0,
      utilization, activeFarmers: queue.length,
      completedToday: completedCount, congestionLevel,
    };
  }));
  return res.json({ success: true, data: comparison });
}));

function generateMockChart(days: number, min: number, max: number) {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().split('T')[0],
      value: Math.floor(Math.random() * (max - min + 1)) + min,
    });
  }
  return data;
}

export default router;
