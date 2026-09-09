import { Router } from 'express';
import store from '../data/store';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { generateId } from '../../../shared/utils';

const router = Router();

// GET /api/notifications
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const notifications = store.getNotificationsByUser(req.user!.id);
  const unreadCount = store.getUnreadCount(req.user!.id);
  return res.json({ success: true, data: { notifications, unreadCount } });
}));

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  store.updateNotification(req.params.id, { read: true });
  return res.json({ success: true, message: 'Marked as read' });
}));

// PUT /api/notifications/read-all
router.put('/read-all', authenticateToken, asyncHandler(async (_req, res) => {
  store.markAllRead(_req.user!.id);
  return res.json({ success: true, message: 'All marked as read' });
}));

// POST /api/notifications - create (admin)
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { userId, type, title, titleHi, message, messageHi } = req.body;
  const notif = store.createNotification({
    id: generateId(), userId, type, title, titleHi: titleHi || title,
    message, messageHi: messageHi || message, read: false, createdAt: new Date().toISOString(),
  });
  return res.status(201).json({ success: true, data: notif });
}));

export default router;
