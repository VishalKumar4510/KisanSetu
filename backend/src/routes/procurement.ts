import { Router } from 'express';
import store from '../data/store';
import { authenticateToken, requireRole } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { UserRole, ProcurementStatus, PaymentStatus, NotificationType, PROCUREMENT_FLOW, MSP_RATES } from '../../../shared/types';
import { generateId } from '../../../shared/utils';

const router = Router();

// GET /api/procurement/current
router.get('/current', authenticateToken, asyncHandler(async (req, res) => {
  const farmerId = (req.query.farmerId as string) || req.user!.id;
  const proc = store.getActiveProcurement(farmerId);
  if (!proc) return res.json({ success: true, data: null });
  const produce = proc.produceId ? store.getProduceById(proc.produceId) : null;
  const weighing = store.getWeighingByProcurement(proc.id);
  const quality = store.getQualityCheckByProcurement(proc.id);
  const payment = store.getPaymentByProcurement(proc.id);
  const centre = store.getCentreById(proc.centreId);
  const token = store.getTokenById(proc.tokenId);
  return res.json({ success: true, data: { ...proc, produce, weighing, quality, payment, centreName: centre?.name, tokenNumber: token?.tokenNumber } });
}));

// GET /api/procurement/history
router.get('/history', authenticateToken, asyncHandler(async (req, res) => {
  const farmerId = (req.query.farmerId as string) || req.user!.id;
  const procs = store.getProcurementByFarmer(farmerId);
  return res.json({ success: true, data: procs });
}));

// GET /api/procurement (all - officer/admin)
router.get('/', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), asyncHandler(async (req, res) => {
  let procs = store.getAllProcurements();
  const { status, centreId } = req.query;
  if (status) procs = procs.filter(p => p.status === status);
  if (centreId) procs = procs.filter(p => p.centreId === centreId);
  const enriched = procs.map(p => {
    const farmer = store.getFarmerById(p.farmerId);
    const produce = p.produceId ? store.getProduceById(p.produceId) : null;
    const token = store.getTokenById(p.tokenId);
    return { ...p, farmerName: farmer?.name, farmerId: farmer?.farmerId, produce, tokenNumber: token?.tokenNumber };
  });
  return res.json({ success: true, data: enriched });
}));

// GET /api/procurement/:id
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const proc = store.getProcurementById(req.params.id);
  if (!proc) throw new AppError('Procurement not found', 404);
  const produce = proc.produceId ? store.getProduceById(proc.produceId) : null;
  const weighing = store.getWeighingByProcurement(proc.id);
  const quality = store.getQualityCheckByProcurement(proc.id);
  const payment = store.getPaymentByProcurement(proc.id);
  return res.json({ success: true, data: { ...proc, produce, weighing, quality, payment } });
}));

// PUT /api/procurement/:id/status - state transition
router.put('/:id/status', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), asyncHandler(async (req, res) => {
  const proc = store.getProcurementById(req.params.id);
  if (!proc) throw new AppError('Procurement not found', 404);

  const { status, weighingData, qualityData } = req.body;
  const targetStatus = status as ProcurementStatus;
  const currentIdx = PROCUREMENT_FLOW.indexOf(proc.status);
  const targetIdx = PROCUREMENT_FLOW.indexOf(targetStatus);
  if (targetIdx !== currentIdx + 1) {
    throw new AppError(`Invalid transition from ${proc.status} to ${targetStatus}`, 400);
  }

  const now = new Date().toISOString();
  const updates: any = { status: targetStatus };
  const timestampKey = targetStatus.charAt(0).toLowerCase() + targetStatus.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase()) + 'At';
  updates[timestampKey] = now;

  // Handle specific state transitions
  if (targetStatus === ProcurementStatus.WEIGHING && weighingData) {
    store.createWeighing({
      id: generateId(), procurementId: proc.id,
      grossWeight: weighingData.grossWeight, tareWeight: weighingData.tareWeight,
      netWeight: weighingData.netWeight || weighingData.grossWeight - weighingData.tareWeight,
      timestamp: now,
    });
  }

  if (targetStatus === ProcurementStatus.QUALITY_CHECK && qualityData) {
    store.createQualityCheck({
      id: generateId(), procurementId: proc.id,
      moistureContent: qualityData.moistureContent, foreignMatter: qualityData.foreignMatter || 0,
      grade: qualityData.grade, accepted: qualityData.accepted !== false,
      remarks: qualityData.remarks || '', timestamp: now,
    });
  }

  if (targetStatus === ProcurementStatus.PAYMENT_PENDING) {
    const produce = proc.produceId ? store.getProduceById(proc.produceId) : null;
    const weighing = store.getWeighingByProcurement(proc.id);
    const qty = weighing?.netWeight || produce?.quantity || 0;
    const rate = produce?.mspRate || 0;
    const gross = qty * rate;
    const deductions = Math.round(gross * 0.02);
    store.createPayment({
      id: generateId(), procurementId: proc.id, farmerId: proc.farmerId,
      grossAmount: gross, deductions, netAmount: gross - deductions,
      status: PaymentStatus.PENDING, createdAt: now,
    });
  }

  if (targetStatus === ProcurementStatus.PAYMENT_PROCESSING) {
    const payment = store.getPaymentByProcurement(proc.id);
    if (payment) store.updatePayment(payment.id, { status: PaymentStatus.PROCESSING });
  }

  if (targetStatus === ProcurementStatus.COMPLETED) {
    const payment = store.getPaymentByProcurement(proc.id);
    if (payment) {
      const dbtRef = `DBT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      store.updatePayment(payment.id, { status: PaymentStatus.COMPLETED, dbtReferenceId: dbtRef, processedAt: now });
    }
    const token = store.getTokenById(proc.tokenId);
    if (token) store.updateToken(token.id, { status: 'USED' });
  }

  const updated = store.updateProcurement(proc.id, updates);

  // Create notification
  const notifTypes: Partial<Record<ProcurementStatus, { type: NotificationType; title: string; titleHi: string; msg: string; msgHi: string }>> = {
    [ProcurementStatus.GATE_ENTRY]: { type: NotificationType.GATE_ENTRY, title: 'Gate Entry', titleHi: 'गेट प्रवेश', msg: 'You have entered the gate.', msgHi: 'आपने गेट में प्रवेश किया है।' },
    [ProcurementStatus.WEIGHING]: { type: NotificationType.WEIGHING_COMPLETED, title: 'Weighing Done', titleHi: 'तौल पूर्ण', msg: 'Weighing is complete.', msgHi: 'तौल पूर्ण हो गई है।' },
    [ProcurementStatus.QUALITY_CHECK]: { type: NotificationType.QUALITY_COMPLETED, title: 'Quality Check Done', titleHi: 'गुणवत्ता जाँच पूर्ण', msg: 'Quality check completed.', msgHi: 'गुणवत्ता जाँच पूर्ण।' },
    [ProcurementStatus.COMPLETED]: { type: NotificationType.PROCUREMENT_COMPLETED, title: 'Procurement Complete', titleHi: 'खरीद पूर्ण', msg: 'Your procurement is complete!', msgHi: 'आपकी खरीद पूर्ण हो गई है!' },
  };
  const notif = notifTypes[targetStatus];
  if (notif) {
    store.createNotification({
      id: generateId(), userId: proc.farmerId, type: notif.type,
      title: notif.title, titleHi: notif.titleHi,
      message: notif.msg, messageHi: notif.msgHi,
      read: false, createdAt: now,
    });
  }

  // Audit log
  store.createAuditLog({
    id: generateId(), userId: req.user!.id,
    action: `STATUS_CHANGE_${targetStatus}`, entity: 'Procurement',
    entityId: proc.id, details: `Status changed from ${proc.status} to ${targetStatus}`,
    timestamp: now,
  });

  return res.json({ success: true, data: updated });
}));

export default router;
