import { Router } from 'express';
import store from '../data/store';
import { notificationRepository } from '../repositories/notificationRepository';
import { authenticateToken, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { notificationService, deliveryRecordRepository } from '../services/notifications';
import { UserRole } from '../../../shared/types';

const router = Router();

// GET /api/notifications
// Retrieves user notifications and unread count
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const targetUserId = (req.user!.role === UserRole.ADMIN && req.query.userId)
    ? (req.query.userId as string)
    : req.user!.id;

  const notifications = (await notificationRepository.findByUserId(targetUserId).catch(() => null)) || store.getNotificationsByUser(targetUserId);
  const unreadCount = notifications.filter(n => !n.read).length;
  return res.json({ success: true, data: { notifications, unreadCount } });
}));

// PUT /api/notifications/:id/read
// Marks a single notification as read
router.put('/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  const notifs = (await notificationRepository.findByUserId(req.user!.id).catch(() => null)) || store.getNotificationsByUser(req.user!.id);
  const userNotif = notifs.find(n => n.id === req.params.id);
  if (!userNotif && req.user!.role !== UserRole.ADMIN) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }

  // Update in PostgreSQL
  await notificationRepository.markAsRead(req.params.id).catch(() => null);

  // Sync store
  store.updateNotification(req.params.id, { read: true });

  // Update in deliveryRecordRepository
  deliveryRecordRepository.markInAppRead(req.params.id);

  return res.json({ success: true, message: 'Marked as read' });
}));

// PUT /api/notifications/read-all
// Marks all user notifications as read
router.put('/read-all', authenticateToken, asyncHandler(async (_req, res) => {
  await notificationRepository.markAllAsRead(_req.user!.id).catch(() => null);
  store.markAllRead(_req.user!.id);
  return res.json({ success: true, message: 'All marked as read' });
}));

// POST /api/notifications - create notification (Admin/Officer role protected)
router.post('/', authenticateToken, requireRole(UserRole.ADMIN, UserRole.OFFICER), asyncHandler(async (req, res) => {
  const { userId, type, title, titleHi, message, messageHi, channels, idempotencyKey } = req.body;

  if (!userId || !type || !title || !message) {
    return res.status(400).json({
      success: false,
      error: 'userId, type, title, and message are required',
    });
  }

  const dispatchResult = await notificationService.sendDirectNotification({
    userId,
    type,
    title,
    titleHi: titleHi || title,
    message,
    messageHi: messageHi || message,
    channels,
    idempotencyKey,
  });

  return res.status(201).json({
    success: true,
    data: {
      eventId: dispatchResult.eventId,
      idempotencyKey: dispatchResult.idempotencyKey,
      duplicate: dispatchResult.duplicate,
      deliveries: dispatchResult.deliveries,
    },
  });
}));

// GET /api/notifications/deliveries - delivery records audit (Admin role protected)
router.get('/deliveries', authenticateToken, requireRole(UserRole.ADMIN), asyncHandler(async (_req, res) => {
  const deliveries = deliveryRecordRepository.getAll();
  return res.json({ success: true, data: deliveries });
}));

export default router;
