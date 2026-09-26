import { NotificationType } from '../../../../shared/types';
import { notificationRepository } from '../../repositories/notificationRepository';

/**
 * Notification Provider Interface & Simulator Adapter
 * Clean abstraction separating business logic from SMS gateways (e.g. CDAC / NIC SMS) and push providers.
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
 * Simulated Notification Provider
 * Logs message delivery and writes in-app notifications to database.
 */
export class SimulatedNotificationProvider implements NotificationProvider {
  async send(params: SendNotificationParams): Promise<boolean> {
    try {
      await notificationRepository.createNotification({
        userId: params.userId,
        title: params.title,
        titleHi: params.titleHi || params.title,
        message: params.message,
        messageHi: params.messageHi || params.message,
        type: params.type,
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const defaultNotificationProvider: NotificationProvider = new SimulatedNotificationProvider();
