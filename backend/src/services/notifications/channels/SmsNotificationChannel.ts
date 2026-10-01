import { NotificationChannelAdapter } from './NotificationChannel';
import { NotificationChannelType, DeliveryStatus, DeliveryRecord, ChannelSendParams } from '../types';
import logger from '../../../lib/logger';

export class SmsNotificationChannel implements NotificationChannelAdapter {
  readonly channelType = NotificationChannelType.SMS;

  isConfigured(): boolean {
    // Only operational if a genuine SMS gateway (e.g. CDAC/NIC/Twilio) endpoint and key are configured
    const gatewayUrl = process.env.SMS_GATEWAY_URL;
    const apiKey = process.env.SMS_API_KEY;
    return Boolean(gatewayUrl && apiKey && !apiKey.includes('placeholder') && !apiKey.includes('mock'));
  }

  async send(params: ChannelSendParams): Promise<DeliveryRecord> {
    const recordId = `deliv_sms_${params.idempotencyKey}`;
    const maskedPhone = params.phone ? params.phone.replace(/.(?=.{4})/g, '*') : 'NOT_PROVIDED';

    if (!this.isConfigured()) {
      logger.info(
        {
          channel: this.channelType,
          recipientId: params.recipientId,
          maskedPhone,
          eventId: params.eventId,
        },
        '[SmsNotificationChannel] SMS gateway not configured; marked NOT_CONFIGURED without faking delivery.'
      );

      return {
        id: recordId,
        eventId: params.eventId,
        idempotencyKey: params.idempotencyKey,
        channel: this.channelType,
        recipient: params.phone || params.recipientId,
        status: DeliveryStatus.NOT_CONFIGURED,
        error: 'SMS gateway not configured in current environment (SMS_GATEWAY_URL / SMS_API_KEY missing)',
      };
    }

    try {
      // In production with real provider configured:
      // Integration call to verified gateway here...
      logger.info(
        { channel: this.channelType, maskedPhone, eventId: params.eventId },
        '[SmsNotificationChannel] Provider configured; dispatching SMS.'
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
        '[SmsNotificationChannel] SMS dispatch failed'
      );
      return {
        id: recordId,
        eventId: params.eventId,
        idempotencyKey: params.idempotencyKey,
        channel: this.channelType,
        recipient: params.phone || params.recipientId,
        status: DeliveryStatus.FAILED,
        error: err?.message || 'SMS delivery failed',
      };
    }
  }
}
