import { NotificationType } from '../../../../shared/types';

export enum NotificationChannelType {
  IN_APP = 'IN_APP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  NOT_CONFIGURED = 'NOT_CONFIGURED',
}

export interface DeliveryRecord {
  id: string;
  eventId: string;
  idempotencyKey: string;
  channel: NotificationChannelType;
  recipient: string;
  status: DeliveryStatus;
  sentAt?: Date;
  readAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

// ==================== DOMAIN EVENTS ====================

export type BusinessEventType =
  | 'SLOT_BOOKED'
  | 'SLOT_CANCELLED'
  | 'TOKEN_GENERATED'
  | 'QUEUE_UPDATED'
  | 'FARMER_CALLED'
  | 'WEIGHING_COMPLETED'
  | 'QUALITY_COMPLETED'
  | 'PROCUREMENT_COMPLETED'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REVERSED';

export interface BaseBusinessEvent {
  id?: string;
  type: BusinessEventType;
  idempotencyKey?: string;
  timestamp?: Date;
}

export interface SlotBookedEvent extends BaseBusinessEvent {
  type: 'SLOT_BOOKED';
  farmerId: string;
  slotId: string;
  centreId: string;
  centreName: string;
  slotDate: string;
  slotTime: string;
  tokenNumber: string;
}

export interface SlotCancelledEvent extends BaseBusinessEvent {
  type: 'SLOT_CANCELLED';
  farmerId: string;
  slotId: string;
  centreName: string;
  slotDate: string;
}

export interface TokenGeneratedEvent extends BaseBusinessEvent {
  type: 'TOKEN_GENERATED';
  farmerId: string;
  tokenId: string;
  tokenNumber: string;
  centreName: string;
  queuePosition: number;
}

export interface QueueUpdatedEvent extends BaseBusinessEvent {
  type: 'QUEUE_UPDATED';
  centreId: string;
  centreName: string;
  reason?: string;
  affectedFarmerIds?: string[];
}

export interface FarmerCalledEvent extends BaseBusinessEvent {
  type: 'FARMER_CALLED';
  farmerId: string;
  tokenId: string;
  tokenNumber: string;
  centreName: string;
  bayNumber?: string | number;
}

export interface WeighingCompletedEvent extends BaseBusinessEvent {
  type: 'WEIGHING_COMPLETED';
  farmerId: string;
  procurementId: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
}

export interface QualityCompletedEvent extends BaseBusinessEvent {
  type: 'QUALITY_COMPLETED';
  farmerId: string;
  procurementId: string;
  grade: string;
  qualityResult: string;
}

export interface ProcurementCompletedEvent extends BaseBusinessEvent {
  type: 'PROCUREMENT_COMPLETED';
  farmerId: string;
  procurementId: string;
  produceType: string;
  netAmount: number;
}

export interface PaymentProcessingEvent extends BaseBusinessEvent {
  type: 'PAYMENT_PROCESSING';
  farmerId: string;
  paymentId: string;
  netAmount: number;
  dbtReferenceId?: string;
}

export interface PaymentSuccessEvent extends BaseBusinessEvent {
  type: 'PAYMENT_SUCCESS';
  farmerId: string;
  paymentId: string;
  netAmount: number;
  utr: string;
  dbtReferenceId?: string;
}

export interface PaymentFailedEvent extends BaseBusinessEvent {
  type: 'PAYMENT_FAILED';
  farmerId: string;
  paymentId: string;
  netAmount: number;
  reason: string;
}

export interface PaymentReversedEvent extends BaseBusinessEvent {
  type: 'PAYMENT_REVERSED';
  farmerId: string;
  paymentId: string;
  netAmount: number;
  reason: string;
}

export type BusinessEvent =
  | SlotBookedEvent
  | SlotCancelledEvent
  | TokenGeneratedEvent
  | QueueUpdatedEvent
  | FarmerCalledEvent
  | WeighingCompletedEvent
  | QualityCompletedEvent
  | ProcurementCompletedEvent
  | PaymentProcessingEvent
  | PaymentSuccessEvent
  | PaymentFailedEvent
  | PaymentReversedEvent;

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  titleHi: string;
  message: string;
  messageHi: string;
  phone?: string;
  email?: string;
  channels: NotificationChannelType[];
  metadata?: Record<string, any>;
}

export interface ChannelSendParams {
  eventId: string;
  idempotencyKey: string;
  recipientId: string;
  phone?: string;
  email?: string;
  title: string;
  titleHi: string;
  message: string;
  messageHi: string;
  type: NotificationType;
  metadata?: Record<string, any>;
}

export interface DispatchResult {
  eventId: string;
  idempotencyKey: string;
  duplicate: boolean;
  deliveries: DeliveryRecord[];
}
