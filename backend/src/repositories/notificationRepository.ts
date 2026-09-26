import { prisma } from '../lib/prisma';
import { Notification, NotificationType } from '../../../shared/types';

export class NotificationRepository {
  async findByUserId(userId: string): Promise<Notification[]> {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return notifications.map(n => this.mapToNotification(n));
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
    const created = await prisma.notification.create({
      data: {
        id: data.id || `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        titleHi: data.titleHi,
        message: data.message,
        messageHi: data.messageHi,
        read: data.read || false,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      },
    });
    return this.mapToNotification(created);
  }

  async markAsRead(id: string): Promise<Notification | null> {
    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    return this.mapToNotification(updated);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return result.count;
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
      createdAt: n.createdAt.toISOString(),
    };
  }
}

export const notificationRepository = new NotificationRepository();
export default notificationRepository;
