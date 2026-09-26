import { Router } from 'express';
import store from '../data/store';
import { notificationRepository } from '../repositories/notificationRepository';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { generateId } from '../../../shared/utils';

const router = Router();

// GET /api/notifications
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const notifications = (await notificationRepository.findByUserId(req.user!.id).catch(() => null)) || store.getNotificationsByUser(req.user!.id);
  const unreadCount = notifications.filter(n => !n.read).length;
  return res.json({ success: true, data: { notifications, unreadCount } });
}));

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  const notifs = store.getNotificationsByUser(req.user!.id);
  const userNotif = notifs.find(n => n.id === req.params.id);
  if (!userNotif) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }

  // Update in PostgreSQL
  await notificationRepository.markAsRead(req.params.id).catch(() => null);

  // Sync store
  store.updateNotification(req.params.id, { read: true });
  return res.json({ success: true, message: 'Marked as read' });
}));

// PUT /api/notifications/read-all
router.put('/read-all', authenticateToken, asyncHandler(async (_req, res) => {
  await notificationRepository.markAllAsRead(_req.user!.id).catch(() => null);
  store.markAllRead(_req.user!.id);
  return res.json({ success: true, message: 'All marked as read' });
}));

// POST /api/notifications - create (admin)
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { userId, type, title, titleHi, message, messageHi } = req.body;
  const newId = generateId();

  await notificationRepository.createNotification({
    id: newId,
    userId,
    type,
    title,
    titleHi: titleHi || title,
    message,
    messageHi: messageHi || message,
    read: false,
    createdAt: new Date().toISOString(),
  }).catch(() => null);

  const notif = store.createNotification({
    id: newId,
    userId,
    type,
    title,
    titleHi: titleHi || title,
    message,
    messageHi: messageHi || message,
    read: false,
    createdAt: new Date().toISOString(),
  });
  return res.status(201).json({ success: true, data: notif });
}));

export default router;
