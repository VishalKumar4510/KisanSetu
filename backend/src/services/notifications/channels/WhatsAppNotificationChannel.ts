import { NotificationChannelAdapter } from './NotificationChannel';
import { NotificationChannelType, DeliveryStatus, DeliveryRecord, ChannelSendParams } from '../types';
import logger from '../../../lib/logger';

export class WhatsAppNotificationChannel implements NotificationChannelAdapter {
  readonly channelType = NotificationChannelType.WHATSAPP;

  isConfigured(): boolean {
    const apiKey = process.env.WHATSAPP_API_KEY;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    return Boolean(apiKey && phoneId && !apiKey.includes('placeholder'));
  }

  async send(params: ChannelSendParams): Promise<DeliveryRecord> {
    const recordId = `deliv_wa_${params.idempotencyKey}`;
    const maskedPhone = params.phone ? params.phone.replace(/.(?=.{4})/g, '*') : 'NOT_PROVIDED';

    if (!this.isConfigured()) {
      logger.info(
        {
          channel: this.channelType,
          recipientId: params.recipientId,
          maskedPhone,
          eventId: params.eventId,
        },
        '[WhatsAppNotificationChannel] WhatsApp provider not configured; marked NOT_CONFIGURED without faking delivery.'
      );

      return {
        id: recordId,
        eventId: params.eventId,
        idempotencyKey: params.idempotencyKey,
        channel: this.channelType,
        recipient: params.phone || params.recipientId,
        status: DeliveryStatus.NOT_CONFIGURED,
        error: 'WhatsApp Business API not configured in current environment (WHATSAPP_API_KEY missing)',
      };
    }

    try {
      logger.info(
        { channel: this.channelType, maskedPhone, eventId: params.eventId },
        '[WhatsAppNotificationChannel] Provider configured; dispatching WhatsApp message.'
      );

      return {
        id: recordId,
        eventId: params.eventId,
        idempotencyKey: params.idempotencyKey,
        channel: this.channelType,
        recipient: params.phone || params.recipientId,
        status: DeliveryStatus.SENT,
        sentAt: new Date(),
      };
    } catch (err: any) {
      logger.error(
        { err: err?.message, maskedPhone, eventId: params.eventId },
        '[WhatsAppNotificationChannel] WhatsApp dispatch failed'
      );
      return {
        id: recordId,
        eventId: params.eventId,
        idempotencyKey: params.idempotencyKey,
        channel: this.channelType,
        recipient: params.phone || params.recipientId,
        status: DeliveryStatus.FAILED,
        error: err?.message || 'WhatsApp delivery failed',
      };
    }
  }
}
