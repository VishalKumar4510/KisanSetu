/**
 * Production Payment Architecture Types & Event Models
 * Phase 28: Provider-Agnostic Payment & Webhook Architecture
 */

export type PaymentState = 'CREATED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REVERSED';

export type PaymentMode = 'SIMULATED' | 'PRODUCTION';

export interface PaymentAuditEntry {
  timestamp: string;
  fromState?: PaymentState;
  toState: PaymentState;
  event: string;
  actor: string;
  details?: Record<string, any>;
}

export interface PaymentTransaction {
  id: string;
  paymentId: string;
  procurementId: string;
  farmerId: string;
  amount: number;
  currency: string;
  state: PaymentState;
  provider: string;
  providerReferenceId: string;
  idempotencyKey: string;
  utr?: string;
  dbtReferenceId?: string;
  failureReason?: string;
  initiatedAt: string;
  settledAt?: string;
  auditLog: PaymentAuditEntry[];
  metadata?: Record<string, any>;
}

export interface InitiatePaymentParams {
  procurementId: string;
  paymentId?: string;
  farmerId: string;
  amount: number;
  bankAccount?: string;
  ifsc?: string;
  idempotencyKey?: string;
  actorName?: string;
  simulateFailure?: boolean;
}

export interface SettlementParams {
  transactionId?: string;
  paymentId: string;
  utr: string;
  dbtReferenceId: string;
  actorName?: string;
}

export interface WebhookPayload {
  eventId: string;
  eventType: string;
  provider: string;
  providerReferenceId: string;
  transactionId?: string;
  paymentId?: string;
  state: PaymentState;
  amount?: number;
  utr?: string;
  dbtReferenceId?: string;
  failureReason?: string;
  timestamp: string;
}

export interface WebhookResult {
  success: boolean;
  duplicate?: boolean;
  state?: PaymentState;
  transactionId?: string;
  paymentId?: string;
  utr?: string;
  dbtReferenceId?: string;
  message?: string;
}

export interface PaymentReceipt {
  receiptNumber: string;
  issuedAt: string;
  payment: {
    id: string;
    status: string;
    state: PaymentState;
    grossAmount: number;
    deductions: number;
    netAmount: number;
    utr?: string;
    dbtReferenceId?: string;
    paymentMethod: string;
    processedAt?: string;
  };
  procurement: any;
  farmer: any;
  centre: any;
  token?: any;
  weighing?: any;
  qualityCheck?: any;
}
