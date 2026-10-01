import { prisma } from '../lib/prisma';
import { Notification, NotificationType } from '../../../shared/types';
import store from '../data/store';

export class NotificationRepository {
  async findByUserId(userId: string): Promise<Notification[]> {
    try {
      const dbNotifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      const dbMapped = dbNotifications.map(n => this.mapToNotification(n));
      const storeNotifications = store.getNotificationsByUser(userId);

      const map = new Map<string, Notification>();
      for (const n of storeNotifications) map.set(n.id, n);
      for (const n of dbMapped) map.set(n.id, n);

      return Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch {
      return store.getNotificationsByUser(userId);
    }
  }

  async findById(id: string): Promise<Notification | null> {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id },
      });
      if (notification) return this.mapToNotification(notification);
    } catch {
      // Fallback to store
    }
    const storeNotifs = Array.from(store.getAllFarmers ? store.getNotificationsByUser('') : []);
    const inStore = storeNotifs.find(n => n.id === id);
    return inStore || null;
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const notifications = await this.findByUserId(userId);
      return notifications.filter(n => !n.read).length;
    } catch {
      return store.getNotificationsByUser(userId).filter(n => !n.read).length;
    }
  }

  async createNotification(data: {
    id?: string;
    userId: string;
    type: NotificationType;
    title: string;
    titleHi: string;
    message: string;
    messageHi: string;
    read?: boolean;
    createdAt?: string;
  }): Promise<Notification> {
    const notifId = data.id || `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();

    const inMemoryNotif: Notification = {
      id: notifId,
      userId: data.userId,
      type: data.type,
      title: data.title,
      titleHi: data.titleHi,
      message: data.message,
      messageHi: data.messageHi,
      read: data.read || false,
      createdAt: createdAt.toISOString(),
    };
    store.createNotification(inMemoryNotif);

    try {
      const created = await prisma.notification.create({
        data: {
          id: notifId,
          userId: data.userId,
          type: data.type as any,
          title: data.title,
          titleHi: data.titleHi,
          message: data.message,
          messageHi: data.messageHi,
          read: data.read || false,
          createdAt,
        },
      });
      return this.mapToNotification(created);
    } catch {
      return inMemoryNotif;
    }
  }

  async markAsRead(id: string): Promise<Notification | null> {
    store.updateNotification(id, { read: true });
    try {
      const updated = await prisma.notification.update({
        where: { id },
        data: { read: true },
      });
      return this.mapToNotification(updated);
    } catch {
      return null;
    }
  }

  async markAllAsRead(userId: string): Promise<number> {
    store.markAllRead(userId);
    try {
      const result = await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      return result.count;
    } catch {
      return 0;
    }
  }

  private mapToNotification(n: any): Notification {
    return {
      id: n.id,
      userId: n.userId,
      type: n.type as NotificationType,
      title: n.title,
      titleHi: n.titleHi,
      message: n.message,
      messageHi: n.messageHi,
      read: n.read,
      createdAt: n.createdAt.toISOString ? n.createdAt.toISOString() : String(n.createdAt),
    };
  }
}

export const notificationRepository = new NotificationRepository();
export default notificationRepository;
