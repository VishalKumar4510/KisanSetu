import { Router } from 'express';
import store from '../data/store';
import { farmerRepository } from '../repositories/farmerRepository';
import { centreRepository } from '../repositories/centreRepository';
import { slotRepository } from '../repositories/slotRepository';
import { tokenRepository } from '../repositories/tokenRepository';
import { procurementRepository } from '../repositories/procurementRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { authenticateToken, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { UserRole, ProduceType, MSP_RATES } from '../../../shared/types';
import { generateId } from '../../../shared/utils';

const router = Router();

// GET /api/farmers - list all farmers (OFFICER/ADMIN)
router.get('/', authenticateToken, requireRole(UserRole.OFFICER, UserRole.ADMIN), asyncHandler(async (_req, res) => {
  const farmers = (await farmerRepository.getAllFarmers().catch(() => null)) || store.getAllFarmers();
  const sanitized = farmers.map(f => {
    const { password: _, ...rest } = f;
    return rest;
  });
  return res.json({ success: true, data: sanitized });
}));

// GET /api/farmers/me - current farmer profile
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const farmer = (await farmerRepository.findById(req.user!.id).catch(() => null)) || store.getFarmerById(req.user!.id);
  if (!farmer) {
    return res.status(404).json({ success: false, error: 'Farmer profile not found' });
  }

  const produce = (await farmerRepository.getProduceByFarmer(farmer.id).catch(() => null)) || store.getProduceByFarmer(farmer.id);
  const activeProcurement = (await procurementRepository.findActiveByFarmerId(farmer.id).catch(() => null)) || store.getActiveProcurement(farmer.id);
  const activeToken = (await tokenRepository.findActiveByFarmerId(farmer.id).catch(() => null)) || store.getActiveTokenByFarmer(farmer.id);
  const payments = (await paymentRepository.findByFarmerId(farmer.id).catch(() => null)) || store.getPaymentsByFarmer(farmer.id);
  const latestPayment = payments.length > 0 ? payments[0] : store.getCurrentPayment(farmer.id);
  const { password: _, ...farmerData } = farmer;

  const enrichedProcurement = activeProcurement ? {
    ...activeProcurement,
    centreName: store.getCentreById(activeProcurement.centreId)?.name,
  } : undefined;

  const enrichedToken = activeToken ? (() => {
    const centre = store.getCentreById(activeToken.centreId);
    const slot = store.getSlotById(activeToken.slotId);
    return {
      ...activeToken,
      centreName: centre?.name,
      slotDate: slot?.date,
      slotTime: slot ? `${slot.timeStart} – ${slot.timeEnd}` : undefined,
    };
  })() : undefined;

  return res.json({
    success: true,
    data: {
      ...farmerData,
      produce,
      activeProcurement: enrichedProcurement,
      activeToken: enrichedToken,
      latestPayment,
    },
  });
}));

// PUT /api/farmers/me - update profile
router.put('/me', authenticateToken, asyncHandler(async (req, res) => {
  const updated = (await farmerRepository.updateFarmer(req.user!.id, req.body).catch(() => null)) || store.updateFarmer(req.user!.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Farmer not found' });
  store.updateFarmer(req.user!.id, req.body); // Sync store
  const { password: _, ...data } = updated;
  return res.json({ success: true, data });
}));

// GET /api/farmers/produce - farmer's produce list
router.get('/produce', authenticateToken, asyncHandler(async (req, res) => {
  const produce = (await farmerRepository.getProduceByFarmer(req.user!.id).catch(() => null)) || store.getProduceByFarmer(req.user!.id);
  return res.json({ success: true, data: produce });
}));

// POST /api/farmers/produce - register produce
router.post('/produce', authenticateToken, asyncHandler(async (req, res) => {
  const { type, quantity, unit = 'quintal', grade } = req.body;
  if (!type || !quantity) {
    return res.status(400).json({ success: false, error: 'Produce type and quantity required' });
  }
  const mspRate = MSP_RATES[type as ProduceType] || 0;
  const prodId = generateId();

  const prod = await farmerRepository.createProduce({
    id: prodId,
    farmerId: req.user!.id,
    type: type as ProduceType,
    quantity: Number(quantity),
    unit,
    grade,
    mspRate,
  }).catch(() => null);

  const localProd = store.createProduce({
    id: prodId,
    farmerId: req.user!.id,
    type: type as ProduceType,
    quantity: Number(quantity),
    unit,
    grade,
    mspRate,
  });

  return res.status(201).json({ success: true, data: prod || localProd });
}));

// GET /api/farmers/:id - get farmer by id
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const farmer = (await farmerRepository.findById(req.params.id).catch(() => null)) ||
                 store.getFarmerById(req.params.id) ||
                 store.getFarmerByFarmerId(req.params.id);
  if (!farmer) return res.status(404).json({ success: false, error: 'Farmer not found' });

  // BOLA/IDOR Protection: Farmers can only view their own profile
  if (req.user!.role === UserRole.FARMER) {
    const isSelf = req.user!.id === farmer.id || req.user!.id === farmer.farmerId;
    if (!isSelf) {
      return res.status(403).json({ success: false, error: 'Forbidden: You cannot access another farmer profile' });
    }
  }

  const produce = (await farmerRepository.getProduceByFarmer(farmer.id).catch(() => null)) || store.getProduceByFarmer(farmer.id);
  const { password: _, ...data } = farmer;
  return res.json({ success: true, data: { ...data, produce } });
}));

export default router;
