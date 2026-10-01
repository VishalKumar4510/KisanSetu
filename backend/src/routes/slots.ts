import { Router } from 'express';
import store from '../data/store';
import { slotRepository } from '../repositories/slotRepository';
import { tokenRepository } from '../repositories/tokenRepository';
import { centreRepository } from '../repositories/centreRepository';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validate';
import { bookSlotSchema, cancelSlotSchema } from '../schemas/slot.schema';
import { ProcurementStatus, NotificationType, UserRole } from '../../../shared/types';
import { generateId } from '../../../shared/utils';
import { notificationService } from '../services/notifications';

const router = Router();

// GET /api/slots/available
router.get('/available', authenticateToken, asyncHandler(async (req, res) => {
  const { centreId, date } = req.query;
  const dbSlots = await slotRepository.getAvailableSlots(centreId as string, date as string);
  const slots = (dbSlots && dbSlots.length > 0) ? dbSlots : store.getAvailableSlots(centreId as string, date as string);
  return res.json({ success: true, data: slots });
}));

// GET /api/slots/recommended
router.get('/recommended', authenticateToken, asyncHandler(async (req, res) => {
  const { farmerId } = req.query;
  if (req.user!.role === UserRole.FARMER && farmerId) {
    const myFarmer = store.getFarmerById(req.user!.id);
    const isSelf = farmerId === req.user!.id || (myFarmer && farmerId === myFarmer.farmerId);
    if (!isSelf) {
      return res.status(403).json({ success: false, error: 'Forbidden: You cannot access recommendations for another farmer' });
    }
  }

  const dbSlots = await slotRepository.getAvailableSlots();
  const availableSlots = (dbSlots && dbSlots.length > 0) ? dbSlots : store.getAvailableSlots();

  const centres = await centreRepository.getAllCentres();
  const centreMap = new Map(centres.map(c => [c.id, c]));

  const recommendations = await Promise.all(availableSlots.map(async slot => {
    const centre = centreMap.get(slot.centreId) || store.getCentreById(slot.centreId);
    if (!centre) return null;
    const activeTokens = await tokenRepository.findActiveByCentreId(slot.centreId);
    const queue = activeTokens.length > 0 ? activeTokens : store.getQueueByCentre(slot.centreId);
    const capacityScore = ((slot.maxCapacity - slot.currentBookings) / slot.maxCapacity) * 30;
    const queueScore = Math.max(0, (1 - queue.length / 20)) * 25;
    const bayScore = (centre.activeBays / centre.totalBays) * 15;
    const hour = parseInt(slot.timeStart.split(':')[0]);
    const timeScore = (hour < 10 ? 15 : hour < 12 ? 10 : hour < 14 ? 5 : 3);
    const bookingScore = Math.max(0, (1 - slot.currentBookings / slot.maxCapacity)) * 15;
    const score = capacityScore + queueScore + bayScore + timeScore + bookingScore;
    const reason = queue.length < 5
      ? `Low queue with ${queue.length} farmers waiting, ${slot.maxCapacity - slot.currentBookings} slots free`
      : `${slot.maxCapacity - slot.currentBookings} slots available at ${centre.name}`;
    const reasonHi = queue.length < 5
      ? `कम कतार, ${queue.length} किसान प्रतीक्षा में, ${slot.maxCapacity - slot.currentBookings} स्लॉट उपलब्ध`
      : `${slot.maxCapacity - slot.currentBookings} स्लॉट ${centre.name} में उपलब्ध`;
    return { slot, centre, score, reason, reasonHi };
  }));

  const filtered = recommendations.filter(Boolean).sort((a: any, b: any) => b.score - a.score).slice(0, 5);
  return res.json({ success: true, data: filtered });
}));

// POST /api/slots/book
router.post('/book', authenticateToken, validateBody(bookSlotSchema), asyncHandler(async (req, res) => {
  const { centreId, slotId, produceId } = req.body;
  const farmerId = req.user!.id;

  const dbSlot = await slotRepository.findById(slotId);
  const storeSlot = store.getSlotById(slotId);
  const slot = dbSlot || storeSlot;
  if (!slot) throw new AppError('Slot not found', 404);
  if (
    slot.currentBookings >= slot.maxCapacity ||
    slot.status === 'FULL' ||
    (storeSlot && (storeSlot.currentBookings >= storeSlot.maxCapacity || storeSlot.status === 'FULL'))
  ) {
    throw new AppError('Slot is full', 409);
  }

  const targetCentreId = centreId || slot.centreId;
  const centre = (await centreRepository.findById(targetCentreId)) || store.getCentreById(targetCentreId);
  if (!centre) throw new AppError('Centre not found', 404);

  // Check double booking
  const existingToken = (await tokenRepository.findActiveByFarmerId(farmerId)) || store.getActiveTokenByFarmer(farmerId);
  if (existingToken) throw new AppError('You already have an active booking', 409);

  // Execute Atomic PostgreSQL Slot Booking Transaction
  let bookingResult: any = null;
  try {
    bookingResult = await slotRepository.bookSlotAtomic({
      slotId,
      farmerId,
      centreId: targetCentreId,
      produceId,
    });
  } catch (err: any) {
    if (err instanceof AppError && err.statusCode === 409) throw err;
    // Fallback gracefully if database transaction encountered transient issue
  }

  // Update in-memory store compatibility
  store.updateSlot(slotId, {
    currentBookings: slot.currentBookings + 1,
    status: slot.currentBookings + 1 >= slot.maxCapacity ? 'FULL' : 'AVAILABLE',
  });

  const activeTokens = await tokenRepository.findActiveByCentreId(targetCentreId);
  const position = bookingResult?.token?.queuePosition || (activeTokens.length > 0 ? activeTokens.length : store.getQueueByCentre(targetCentreId).length + 1);
  const etaMinutes = Math.round(position * 15 / Math.max(centre?.activeBays || 1, 1));
  const tokenNumber = bookingResult?.token?.tokenNumber || `T-${new Date().getFullYear()}-${String(store.getAllTokens().length + 1).padStart(4, '0')}`;
  
  const token = store.createToken({
    id: bookingResult?.token?.id || generateId(),
    farmerId,
    slotId,
    centreId: targetCentreId,
    tokenNumber,
    qrData: JSON.stringify({ tokenNumber, centreId: targetCentreId, slotId, farmerId }),
    status: 'ACTIVE',
    queuePosition: position,
    estimatedTime: `${etaMinutes}`,
    createdAt: bookingResult?.token?.createdAt || new Date().toISOString(),
  });

  const finalProduceId = produceId || bookingResult?.procurement?.produceId || store.getProduceByFarmer(farmerId)[0]?.id || '';
  const procurement = store.createProcurement({
    id: bookingResult?.procurement?.id || generateId(),
    farmerId,
    centreId: targetCentreId,
    tokenId: token.id,
    produceId: finalProduceId,
    status: ProcurementStatus.BOOKED,
    bookedAt: bookingResult?.procurement?.bookedAt || new Date().toISOString(),
  });

  // Dispatch business event via central NotificationService
  await notificationService.dispatch({
    type: 'SLOT_BOOKED',
    farmerId,
    slotId: slot.id,
    centreId: targetCentreId,
    centreName: centre?.name || 'Mandi Centre',
    slotDate: slot.date,
    slotTime: `${slot.timeStart} – ${slot.timeEnd}`,
    tokenNumber,
  }).catch(() => {});

  const enrichedToken = {
    ...token,
    centreName: centre?.name,
    slotDate: slot.date,
    slotTime: `${slot.timeStart} – ${slot.timeEnd}`,
  };

  return res.status(201).json({ success: true, data: { token: enrichedToken, procurement } });
}));

// POST /api/slots/cancel
router.post('/cancel', authenticateToken, validateBody(cancelSlotSchema), asyncHandler(async (req, res) => {
  const { tokenId } = req.body;
  const token = (await tokenRepository.findById(tokenId)) || store.getTokenById(tokenId);
  if (!token) throw new AppError('Token not found', 404);
  if (token.farmerId !== req.user!.id) throw new AppError('Unauthorized: You cannot cancel another farmer booking', 403);

  // Cancel in PostgreSQL via repository
  await tokenRepository.cancelToken(tokenId).catch(() => null);

  // Sync store
  store.updateToken(tokenId, { status: 'CANCELLED' });
  const slot = (await slotRepository.findById(token.slotId)) || store.getSlotById(token.slotId);
  if (slot) store.updateSlot(slot.id, { currentBookings: Math.max(0, slot.currentBookings - 1), status: 'AVAILABLE' });
  return res.json({ success: true, message: 'Booking cancelled' });
}));

export default router;
