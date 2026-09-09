import { Router } from 'express';
import store from '../data/store';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ProcurementStatus, NotificationType, PaymentStatus } from '../../../shared/types';
import { generateId } from '../../../shared/utils';

const router = Router();

let demoState = { isRunning: false, currentStep: 'IDLE' as any, farmerId: '', procurementId: '', speed: 1, log: [] as string[] };
let demoTimer: NodeJS.Timeout | null = null;

const STEPS = [
  ProcurementStatus.BOOKED,
  ProcurementStatus.ARRIVED,
  ProcurementStatus.GATE_ENTRY,
  ProcurementStatus.WEIGHING,
  ProcurementStatus.QUALITY_CHECK,
  ProcurementStatus.PROCUREMENT,
  ProcurementStatus.PAYMENT_PENDING,
  ProcurementStatus.PAYMENT_PROCESSING,
  ProcurementStatus.COMPLETED,
];

function advanceDemo() {
  if (!demoState.isRunning) return;
  const currentIdx = STEPS.indexOf(demoState.currentStep as ProcurementStatus);
  if (currentIdx >= STEPS.length - 1) {
    demoState.isRunning = false;
    demoState.currentStep = 'IDLE';
    demoState.log.push('✅ Demo complete! Full procurement journey finished.');
    if (demoTimer) clearTimeout(demoTimer);
    return;
  }
  const nextStep = STEPS[currentIdx + 1];
  const proc = store.getProcurementById(demoState.procurementId);
  if (!proc) return;
  const now = new Date().toISOString();
  const updates: any = { status: nextStep };
  const messages: Record<string, string> = {
    ARRIVED: '🚜 Farmer arrived at the centre',
    GATE_ENTRY: '🚪 Gate entry completed',
    WEIGHING: '⚖️ Weighing in progress... 12.5 quintals recorded',
    QUALITY_CHECK: '🔬 Quality check: Grade A, Moisture 11.2%',
    PROCUREMENT: '✅ Procurement approved at MSP rate',
    PAYMENT_PENDING: '💰 Payment calculation: ₹28,437 pending',
    PAYMENT_PROCESSING: '🏦 Payment processing via DBT...',
    COMPLETED: '🎉 Payment completed! DBT reference generated',
  };

  if (nextStep === ProcurementStatus.WEIGHING) {
    store.createWeighing({ id: generateId(), procurementId: proc.id, grossWeight: 13.2, tareWeight: 0.7, netWeight: 12.5, timestamp: now });
  }
  if (nextStep === ProcurementStatus.QUALITY_CHECK) {
    store.createQualityCheck({ id: generateId(), procurementId: proc.id, moistureContent: 11.2, foreignMatter: 0.5, grade: 'A', accepted: true, remarks: 'Good quality grain', timestamp: now });
  }
  if (nextStep === ProcurementStatus.PAYMENT_PENDING) {
    store.createPayment({ id: generateId(), procurementId: proc.id, farmerId: proc.farmerId, grossAmount: 28437, deductions: 569, netAmount: 27868, status: PaymentStatus.PENDING, createdAt: now });
  }
  if (nextStep === ProcurementStatus.COMPLETED) {
    const payment = store.getPaymentByProcurement(proc.id);
    if (payment) store.updatePayment(payment.id, { status: PaymentStatus.COMPLETED, dbtReferenceId: `DBT-DEMO-${Date.now()}`, processedAt: now });
  }

  store.updateProcurement(proc.id, updates);
  demoState.currentStep = nextStep;
  demoState.log.push(messages[nextStep] || `Step: ${nextStep}`);

  if (nextStep !== ProcurementStatus.COMPLETED) {
    demoTimer = setTimeout(advanceDemo, 3000 / demoState.speed);
  }
}

// POST /api/demo/start
router.post('/start', optionalAuth, asyncHandler(async (req, res) => {
  if (demoState.isRunning) return res.json({ success: true, data: demoState, message: 'Demo already running' });
  const speed = req.body.speed || 1;
  const farmer = store.getAllFarmers()[0];
  const centre = store.getAllCentres()[0];
  const slot = store.getAvailableSlots(centre.id)[0];
  if (!farmer || !centre || !slot) return res.status(500).json({ success: false, error: 'Not enough seed data for demo' });

  const produce = store.getProduceByFarmer(farmer.id)[0];
  const token = store.createToken({
    id: generateId(), farmerId: farmer.id, slotId: slot.id, centreId: centre.id,
    tokenNumber: `T-DEMO-${Date.now()}`, qrData: 'DEMO', status: 'ACTIVE',
    queuePosition: 1, estimatedTime: '15', createdAt: new Date().toISOString(),
  });
  const proc = store.createProcurement({
    id: generateId(), farmerId: farmer.id, centreId: centre.id, tokenId: token.id,
    produceId: produce?.id || '', status: ProcurementStatus.BOOKED, bookedAt: new Date().toISOString(),
  });

  demoState = { isRunning: true, currentStep: ProcurementStatus.BOOKED, farmerId: farmer.id, procurementId: proc.id, speed, log: [`🎬 Demo started for farmer ${farmer.name} at ${centre.name}`] };
  demoTimer = setTimeout(advanceDemo, 3000 / speed);
  return res.json({ success: true, data: demoState });
}));

// POST /api/demo/stop
router.post('/stop', optionalAuth, asyncHandler(async (_req, res) => {
  demoState.isRunning = false;
  demoState.log.push('⏹️ Demo stopped');
  if (demoTimer) clearTimeout(demoTimer);
  return res.json({ success: true, data: demoState });
}));

// GET /api/demo/state
router.get('/state', optionalAuth, asyncHandler(async (_req, res) => {
  return res.json({ success: true, data: demoState });
}));

// POST /api/demo/step
router.post('/step', optionalAuth, asyncHandler(async (_req, res) => {
  if (!demoState.procurementId) return res.status(400).json({ success: false, error: 'No demo active. Start one first.' });
  if (demoTimer) clearTimeout(demoTimer);
  demoState.isRunning = true;
  advanceDemo();
  return res.json({ success: true, data: demoState });
}));

export default router;
