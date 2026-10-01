import { NotificationChannelAdapter } from './NotificationChannel';
import { NotificationChannelType, DeliveryStatus, DeliveryRecord, ChannelSendParams } from '../types';
import { notificationRepository } from '../../../repositories/notificationRepository';
import store from '../../../data/store';
import logger from '../../../lib/logger';

export class InAppNotificationChannel implements NotificationChannelAdapter {
  readonly channelType = NotificationChannelType.IN_APP;

  isConfigured(): boolean {
    return true; // In-app notification channel is always operational
  }

  async send(params: ChannelSendParams): Promise<DeliveryRecord> {
    const recordId = `deliv_inapp_${params.idempotencyKey}`;
    const notificationId = `notif_${params.idempotencyKey}`;

    try {
      // 1. Persist to PostgreSQL database via notificationRepository
      const created = await notificationRepository.createNotification({
        id: notificationId,
        userId: params.recipientId,
        type: params.type,
        title: params.title,
        titleHi: params.titleHi,
        message: params.message,
        messageHi: params.messageHi,
        read: false,
      }).catch(err => {
        logger.warn({ err: err?.message, notificationId }, '[InAppNotificationChannel] DB persistence fallback to store');
        return null;
      });

      // 2. Synchronize in-memory store for instant UI reads
      store.createNotification({
        id: created?.id || notificationId,
        userId: params.recipientId,
        type: params.type,
        title: params.title,
        titleHi: params.titleHi,
        message: params.message,
        messageHi: params.messageHi,
        read: false,
        createdAt: new Date().toISOString(),
      });

      return {
        id: recordId,
        eventId: params.eventId,
        idempotencyKey: params.idempotencyKey,
        channel: this.channelType,
        recipient: params.recipientId,
        status: DeliveryStatus.SENT,
        sentAt: new Date(),
        metadata: { ...params.metadata, notificationId },
      };
    } catch (err: any) {
      logger.error(
        { err: err?.message, recipient: params.recipientId, idempotencyKey: params.idempotencyKey },
        '[InAppNotificationChannel] Failed to dispatch in-app notification'
      );
      return {
        id: recordId,
        eventId: params.eventId,
        idempotencyKey: params.idempotencyKey,
        channel: this.channelType,
        recipient: params.recipientId,
        status: DeliveryStatus.FAILED,
        error: err?.message || 'In-app notification write error',
      };
    }
  }
}
