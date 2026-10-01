import { NotificationChannelType, ChannelSendParams, DeliveryRecord } from '../types';

export interface NotificationChannelAdapter {
  readonly channelType: NotificationChannelType;
  isConfigured(): boolean;
  send(params: ChannelSendParams): Promise<DeliveryRecord>;
}
