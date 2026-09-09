import { Router } from 'express';
import store from '../data/store';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ProcurementStatus, NotificationType, MSP_RATES, ProduceType } from '../../../shared/types';
import { generateId } from '../../../shared/utils';

const router = Router();

// GET /api/slots/available
router.get('/available', authenticateToken, asyncHandler(async (req, res) => {
  const { centreId, date } = req.query;
  const slots = store.getAvailableSlots(centreId as string, date as string);
  return res.json({ success: true, data: slots });
}));

// GET /api/slots/recommended
router.get('/recommended', authenticateToken, asyncHandler(async (req, res) => {
  const { farmerId } = req.query;
  const fId = (farmerId as string) || req.user!.id;
  const availableSlots = store.getAvailableSlots();
  const recommendations = availableSlots.map(slot => {
    const centre = store.getCentreById(slot.centreId);
    if (!centre) return null;
    const queue = store.getQueueByCentre(slot.centreId);
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
  }).filter(Boolean).sort((a: any, b: any) => b.score - a.score).slice(0, 5);
  return res.json({ success: true, data: recommendations });
}));

// POST /api/slots/book
router.post('/book', authenticateToken, asyncHandler(async (req, res) => {
  const { centreId, slotId, produceId } = req.body;
  const farmerId = req.user!.id;
  if (!centreId || !slotId) throw new AppError('Centre and slot are required', 400);

  const slot = store.getSlotById(slotId);
  if (!slot) throw new AppError('Slot not found', 404);
  if (slot.currentBookings >= slot.maxCapacity) throw new AppError('Slot is full', 409);

  // Check double booking
  const existingToken = store.getActiveTokenByFarmer(farmerId);
  if (existingToken) throw new AppError('You already have an active booking', 409);

  // Update slot
  store.updateSlot(slotId, {
    currentBookings: slot.currentBookings + 1,
    status: slot.currentBookings + 1 >= slot.maxCapacity ? 'FULL' : 'AVAILABLE',
  });

  // Create token
  const queue = store.getQueueByCentre(centreId);
  const position = queue.length + 1;
  const centre = store.getCentreById(centreId);
  const etaMinutes = Math.round(position * 15 / Math.max(centre?.activeBays || 1, 1));
  const tokenNumber = `T-${new Date().getFullYear()}-${String(store.getAllTokens().length + 1).padStart(4, '0')}`;
  const token = store.createToken({
    id: generateId(), farmerId, slotId, centreId,
    tokenNumber, qrData: JSON.stringify({ tokenNumber, centreId, slotId, farmerId }),
    status: 'ACTIVE', queuePosition: position,
    estimatedTime: `${etaMinutes}`, createdAt: new Date().toISOString(),
  });

  // Create procurement
  const procurement = store.createProcurement({
    id: generateId(), farmerId, centreId, tokenId: token.id,
    produceId: produceId || '', status: ProcurementStatus.BOOKED,
    bookedAt: new Date().toISOString(),
  });

  // Create notification
  store.createNotification({
    id: generateId(), userId: farmerId, type: NotificationType.SLOT_CONFIRMED,
    title: 'Slot Confirmed', titleHi: 'स्लॉट पुष्टि',
    message: `Your slot at ${centre?.name} is confirmed. Token: ${tokenNumber}`,
    messageHi: `${centre?.name} पर आपका स्लॉट पुष्ट है। टोकन: ${tokenNumber}`,
    read: false, createdAt: new Date().toISOString(),
  });

  return res.status(201).json({ success: true, data: { token, procurement } });
}));

// POST /api/slots/cancel
router.post('/cancel', authenticateToken, asyncHandler(async (req, res) => {
  const { tokenId } = req.body;
  const token = store.getTokenById(tokenId);
  if (!token) throw new AppError('Token not found', 404);
  if (token.farmerId !== req.user!.id) throw new AppError('Unauthorized', 403);
  store.updateToken(tokenId, { status: 'CANCELLED' });
  const slot = store.getSlotById(token.slotId);
  if (slot) store.updateSlot(slot.id, { currentBookings: Math.max(0, slot.currentBookings - 1), status: 'AVAILABLE' });
  return res.json({ success: true, message: 'Booking cancelled' });
}));

export default router;
