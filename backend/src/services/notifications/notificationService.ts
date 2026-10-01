import {
  BusinessEvent,
  DispatchResult,
  NotificationChannelType,
  DeliveryRecord,
  ChannelSendParams,
} from './types';
import { NotificationChannelAdapter } from './channels/NotificationChannel';
import { InAppNotificationChannel } from './channels/InAppNotificationChannel';
import { SmsNotificationChannel } from './channels/SmsNotificationChannel';
import { EmailNotificationChannel } from './channels/EmailNotificationChannel';
import { WhatsAppNotificationChannel } from './channels/WhatsAppNotificationChannel';
import { mapEventToNotifications } from './eventMapper';
import { deliveryRecordRepository } from './deliveryRecordRepository';
import { NotificationType } from '../../../../shared/types';
import logger from '../../lib/logger';
import { generateId } from '../../../../shared/utils';

export class NotificationService {
  private channels: Map<NotificationChannelType, NotificationChannelAdapter> = new Map();
  private processedKeys: Set<string> = new Set();

  constructor() {
    this.registerChannel(new InAppNotificationChannel());
    this.registerChannel(new SmsNotificationChannel());
    this.registerChannel(new EmailNotificationChannel());
    this.registerChannel(new WhatsAppNotificationChannel());
  }

  registerChannel(adapter: NotificationChannelAdapter): void {
    this.channels.set(adapter.channelType, adapter);
  }

  getChannel(type: NotificationChannelType): NotificationChannelAdapter | undefined {
    return this.channels.get(type);
  }

  /**
   * Generates a deterministic, stable idempotency key for domain business events.
   */
  generateIdempotencyKey(event: BusinessEvent): string {
    if (event.idempotencyKey) {
      return event.idempotencyKey;
    }

    switch (event.type) {
      case 'SLOT_BOOKED':
        return `SLOT_BOOKED_${event.slotId}_${event.farmerId}`;
      case 'SLOT_CANCELLED':
        return `SLOT_CANCELLED_${event.slotId}_${event.farmerId}`;
      case 'TOKEN_GENERATED':
        return `TOKEN_GEN_${event.tokenId}`;
      case 'FARMER_CALLED':
        return `FARMER_CALLED_${event.tokenId}`;
      case 'WEIGHING_COMPLETED':
        return `WEIGHING_${event.procurementId}`;
      case 'QUALITY_COMPLETED':
        return `QUALITY_${event.procurementId}`;
      case 'PROCUREMENT_COMPLETED':
        return `PROC_COMPLETED_${event.procurementId}`;
      case 'PAYMENT_PROCESSING':
        return `PAYMENT_PROC_${event.paymentId}`;
      case 'PAYMENT_SUCCESS':
        return `PAYMENT_SUCCESS_${event.paymentId}`;
      case 'PAYMENT_FAILED':
        return `PAYMENT_FAILED_${event.paymentId}`;
      case 'PAYMENT_REVERSED':
        return `PAYMENT_REVERSED_${event.paymentId}`;
      case 'QUEUE_UPDATED':
        return `QUEUE_UPD_${event.centreId}_${Date.now()}`;
      default:
        return `EVENT_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }
  }

  /**
   * Main Entrypoint: Dispatches a business event across configured notification channels.
   * Strictly enforces idempotency to prevent duplicate notifications.
   */
  async dispatch(event: BusinessEvent): Promise<DispatchResult> {
    const eventId = event.id || `evt_${generateId()}`;
    const idempotencyKey = this.generateIdempotencyKey(event);

    // 1. Idempotency Check: Prevent duplicate processing of the same business event
    if (this.processedKeys.has(idempotencyKey)) {
      const existingDeliveries = deliveryRecordRepository.getByIdempotencyKey(idempotencyKey);
      logger.info(
        { eventType: event.type, idempotencyKey, eventId },
        '[NotificationService] Duplicate event detected; skipping duplicate dispatch.'
      );
      return {
        eventId,
        idempotencyKey,
        duplicate: true,
        deliveries: existingDeliveries,
      };
    }

    // Mark key as in-flight/processed
    this.processedKeys.add(idempotencyKey);

    // 2. Map domain event to notification payloads
    const payloads = mapEventToNotifications(event);
    const deliveries: DeliveryRecord[] = [];

    // 3. Dispatch to all requested channels
    for (const payload of payloads) {
      for (const channelType of payload.channels) {
        const adapter = this.channels.get(channelType);
        if (!adapter) {
          logger.warn({ channelType }, '[NotificationService] No adapter registered for channel');
          continue;
        }

        const channelParams: ChannelSendParams = {
          eventId,
          idempotencyKey,
          recipientId: payload.userId,
          phone: payload.phone,
          email: payload.email,
          title: payload.title,
          titleHi: payload.titleHi,
          message: payload.message,
          messageHi: payload.messageHi,
          type: payload.type,
          metadata: payload.metadata,
        };

        const deliveryRecord = await adapter.send(channelParams);
        deliveries.push(deliveryRecord);
        deliveryRecordRepository.save(deliveryRecord);
      }
    }

    logger.info(
      {
        eventType: event.type,
        eventId,
        idempotencyKey,
        totalDeliveries: deliveries.length,
        channels: Array.from(new Set(deliveries.map(d => d.channel))),
      },
      '[NotificationService] Business event notifications dispatched'
    );

    return {
      eventId,
      idempotencyKey,
      duplicate: false,
      deliveries,
    };
  }

  /**
   * Direct notification creation (e.g. Admin or system announcements).
   */
  async sendDirectNotification(params: {
    userId: string;
    type: NotificationType;
    title: string;
    titleHi?: string;
    message: string;
    messageHi?: string;
    channels?: NotificationChannelType[];
    phone?: string;
    email?: string;
    idempotencyKey?: string;
  }): Promise<DispatchResult> {
    const eventId = `evt_${generateId()}`;
    const idempotencyKey =
      params.idempotencyKey || `DIRECT_${params.userId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (this.processedKeys.has(idempotencyKey)) {
      const existing = deliveryRecordRepository.getByIdempotencyKey(idempotencyKey);
      return { eventId, idempotencyKey, duplicate: true, deliveries: existing };
    }
    this.processedKeys.add(idempotencyKey);

    const channelsToUse = params.channels && params.channels.length > 0
      ? params.channels
      : [NotificationChannelType.IN_APP];

    const deliveries: DeliveryRecord[] = [];

    for (const channelType of channelsToUse) {
      const adapter = this.channels.get(channelType);
      if (!adapter) continue;

      const channelParams: ChannelSendParams = {
        eventId,
        idempotencyKey,
        recipientId: params.userId,
        phone: params.phone,
        email: params.email,
        title: params.title,
        titleHi: params.titleHi || params.title,
        message: params.message,
        messageHi: params.messageHi || params.message,
        type: params.type,
      };

      const record = await adapter.send(channelParams);
      deliveries.push(record);
      deliveryRecordRepository.save(record);
    }

    return { eventId, idempotencyKey, duplicate: false, deliveries };
  }

  /**
   * Reset in-memory idempotency cache (useful for testing).
   */
  resetIdempotencyCache(): void {
    this.processedKeys.clear();
  }
}

export const notificationService = new NotificationService();
export default notificationService;
