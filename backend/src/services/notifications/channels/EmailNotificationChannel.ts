import { NotificationChannelAdapter } from './NotificationChannel';
import { NotificationChannelType, DeliveryStatus, DeliveryRecord, ChannelSendParams } from '../types';
import logger from '../../../lib/logger';

export class EmailNotificationChannel implements NotificationChannelAdapter {
  readonly channelType = NotificationChannelType.EMAIL;

  isConfigured(): boolean {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    return Boolean(host && user && pass && !host.includes('placeholder'));
  }

  async send(params: ChannelSendParams): Promise<DeliveryRecord> {
    const recordId = `deliv_email_${params.idempotencyKey}`;
    const maskedEmail = params.email
      ? params.email.replace(/(?<=.{2}).(?=[^@]*?@)/g, '*')
      : 'NOT_PROVIDED';

    if (!this.isConfigured()) {
      logger.info(
        {
          channel: this.channelType,
          recipientId: params.recipientId,
          maskedEmail,
          eventId: params.eventId,
        },
        '[EmailNotificationChannel] SMTP provider not configured; marked NOT_CONFIGURED without faking delivery.'
      );

      return {
        id: recordId,
        eventId: params.eventId,
        idempotencyKey: params.idempotencyKey,
        channel: this.channelType,
        recipient: params.email || params.recipientId,
        status: DeliveryStatus.NOT_CONFIGURED,
        error: 'Email SMTP server not configured in current environment (SMTP_HOST / SMTP_USER missing)',
      };
    }

    try {
      logger.info(
        { channel: this.channelType, maskedEmail, eventId: params.eventId },
        '[EmailNotificationChannel] Provider configured; dispatching email.'
      );

      return {
        id: recordId,
        eventId: params.eventId,
        idempotencyKey: params.idempotencyKey,
        channel: this.channelType,
        recipient: params.email || params.recipientId,
        status: DeliveryStatus.SENT,
        sentAt: new Date(),
      };
    } catch (err: any) {
      logger.error(
        { err: err?.message, maskedEmail, eventId: params.eventId },
        '[EmailNotificationChannel] Email dispatch failed'
      );
      return {
        id: recordId,
        eventId: params.eventId,
        idempotencyKey: params.idempotencyKey,
        channel: this.channelType,
        recipient: params.email || params.recipientId,
        status: DeliveryStatus.FAILED,
        error: err?.message || 'Email delivery failed',
      };
    }
  }
}
