import { Router } from 'express';
import store from '../data/store';
import { authenticateToken, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { UserRole, ProduceType, MSP_RATES } from '../../../shared/types';
import { generateId } from '../../../shared/utils';

const router = Router();

// GET /api/farmers - list all farmers (OFFICER/ADMIN)
router.get('/', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), asyncHandler(async (_req, res) => {
  const farmers = store.getAllFarmers().map(f => { const { password: _, ...rest } = f; return rest; });
  return res.json({ success: true, data: farmers });
}));

// GET /api/farmers/me - current farmer profile
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const farmer = store.getFarmerById(req.user!.id);
  if (!farmer) {
    return res.status(404).json({ success: false, error: 'Farmer profile not found' });
  }
  const produce = store.getProduceByFarmer(farmer.id);
  const activeProcurement = store.getActiveProcurement(farmer.id);
  const activeToken = store.getActiveTokenByFarmer(farmer.id);
  const latestPayment = store.getCurrentPayment(farmer.id);
  const { password: _, ...farmerData } = farmer;
  return res.json({ success: true, data: { ...farmerData, produce, activeProcurement, activeToken, latestPayment } });
}));

// PUT /api/farmers/me - update profile
router.put('/me', authenticateToken, asyncHandler(async (req, res) => {
  const updated = store.updateFarmer(req.user!.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Farmer not found' });
  const { password: _, ...data } = updated;
  return res.json({ success: true, data });
}));

// GET /api/farmers/produce - farmer's produce list
router.get('/produce', authenticateToken, asyncHandler(async (req, res) => {
  const produce = store.getProduceByFarmer(req.user!.id);
  return res.json({ success: true, data: produce });
}));

// POST /api/farmers/produce - register produce
router.post('/produce', authenticateToken, asyncHandler(async (req, res) => {
  const { type, quantity, unit = 'quintal', grade } = req.body;
  if (!type || !quantity) {
    return res.status(400).json({ success: false, error: 'Produce type and quantity required' });
  }
  const mspRate = MSP_RATES[type as ProduceType] || 0;
  const prod = store.createProduce({
    id: generateId(),
    farmerId: req.user!.id,
    type: type as ProduceType,
    quantity: Number(quantity),
    unit,
    grade,
    mspRate,
  });
  return res.status(201).json({ success: true, data: prod });
}));

// GET /api/farmers/:id - get farmer by id
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const farmer = store.getFarmerById(req.params.id);
  if (!farmer) return res.status(404).json({ success: false, error: 'Farmer not found' });
  const produce = store.getProduceByFarmer(farmer.id);
  const { password: _, ...data } = farmer;
  return res.json({ success: true, data: { ...data, produce } });
}));

export default router;
