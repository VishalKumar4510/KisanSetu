import { Router } from 'express';
import store from '../data/store';
import { authenticateToken, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { UserRole, PaymentStatus } from '../../../shared/types';

const router = Router();

// GET /api/payments/current
router.get('/current', authenticateToken, asyncHandler(async (req, res) => {
  const farmerId = (req.query.farmerId as string) || req.user!.id;
  const payment = store.getCurrentPayment(farmerId);
  if (!payment) return res.json({ success: true, data: null });
  const proc = store.getProcurementById(payment.procurementId);
  const produce = proc?.produceId ? store.getProduceById(proc.produceId) : null;
  return res.json({ success: true, data: { ...payment, produce, procurementStatus: proc?.status } });
}));

// GET /api/payments/history
router.get('/history', authenticateToken, asyncHandler(async (req, res) => {
  const farmerId = (req.query.farmerId as string) || req.user!.id;
  const payments = store.getPaymentsByFarmer(farmerId);
  return res.json({ success: true, data: payments });
}));

// GET /api/payments (all - admin)
router.get('/', authenticateToken, requireRole(UserRole.ADMIN, UserRole.OFFICER), asyncHandler(async (req, res) => {
  let payments = store.getAllPayments();
  const { status } = req.query;
  if (status) payments = payments.filter(p => p.status === status);
  const enriched = payments.map(p => {
    const farmer = store.getFarmerById(p.farmerId);
    const proc = store.getProcurementById(p.procurementId);
    const produce = proc?.produceId ? store.getProduceById(proc.produceId) : null;
    return { ...p, farmerName: farmer?.name, farmerId: farmer?.farmerId, produce };
  });
  return res.json({ success: true, data: enriched });
}));

// PUT /api/payments/:id/process
router.put('/:id/process', authenticateToken, requireRole(UserRole.ADMIN), asyncHandler(async (req, res) => {
  const payment = store.getPaymentById(req.params.id);
  if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
  const dbtRef = `DBT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const updated = store.updatePayment(req.params.id, {
    status: PaymentStatus.COMPLETED,
    dbtReferenceId: dbtRef,
    processedAt: new Date().toISOString(),
  });
  return res.json({ success: true, data: updated });
}));

export default router;
