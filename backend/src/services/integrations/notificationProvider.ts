import { NotificationType } from '../../../../shared/types';
import { notificationService } from '../notifications';

/**
 * Notification Provider Interface & Simulator Adapter
 * Clean abstraction separating business logic from SMS gateways and push providers.
 */

export interface SendNotificationParams {
  userId: string;
  title: string;
  titleHi?: string;
  message: string;
  messageHi?: string;
  type: NotificationType;
  phone?: string;
}

export interface NotificationProvider {
  send(params: SendNotificationParams): Promise<boolean>;
}

/**
 * Notification Provider delegating to the central NotificationService
 */
export class SimulatedNotificationProvider implements NotificationProvider {
  async send(params: SendNotificationParams): Promise<boolean> {
    try {
      const result = await notificationService.sendDirectNotification({
        userId: params.userId,
        title: params.title,
        titleHi: params.titleHi,
        message: params.message,
        messageHi: params.messageHi,
        type: params.type,
        phone: params.phone,
      });
      return result.deliveries.some(d => d.status === 'SENT');
    } catch {
      return false;
    }
  }
}

export const defaultNotificationProvider: NotificationProvider = new SimulatedNotificationProvider();

