/**
 * Payment Adapter Interface
 * Phase 28: Provider-Agnostic Payment & Webhook Architecture
 */

import { PaymentState, WebhookPayload } from '../types';

export interface InitiateTransferParams {
  transactionId: string;
  paymentId: string;
  farmerId: string;
  amount: number;
  bankAccount?: string;
  ifsc?: string;
  simulateFailure?: boolean;
}

export interface InitiateTransferResult {
  providerReferenceId: string;
  state: PaymentState;
  utr?: string;
  dbtReferenceId?: string;
  failureReason?: string;
}

export interface PaymentAdapter {
  readonly name: string;
  readonly mode: 'SIMULATED' | 'PRODUCTION';

  /**
   * Check if the provider has all required credentials configured.
   */
  isConfigured(): boolean;

  /**
   * Initiate direct transfer via the payment provider.
   */
  initiateTransfer(params: InitiateTransferParams): Promise<InitiateTransferResult>;

  /**
   * Verify HMAC or cryptographic signature on incoming webhook.
   */
  verifyWebhookSignature(payload: string | object, signature: string): boolean;

  /**
   * Generate signature for outgoing webhook / testing.
   */
  generateWebhookSignature(payload: string | object): string;

  /**
   * Parse raw webhook body into standardized WebhookPayload.
   */
  parseWebhookEvent(body: any, headers?: Record<string, any>): WebhookPayload;
}
