/**
 * Simulated PFMS / NPCI Payment Adapter
 * Phase 28: Provider-Agnostic Payment & Webhook Architecture
 * Provides deterministic simulation of DBT settlement, UTR generation, and webhook security.
 */

import crypto from 'crypto';
import { PaymentAdapter, InitiateTransferParams, InitiateTransferResult } from './PaymentAdapter';
import { WebhookPayload } from '../types';
import config from '../../../lib/config';

export class SimulatedPfmsAdapter implements PaymentAdapter {
  readonly name = 'PFMS_SIMULATED';
  readonly mode = 'SIMULATED' as const;

  private secret: string;

  constructor(secret?: string) {
    this.secret = secret || config.PAYMENT_WEBHOOK_SECRET || 'kisansetu-webhook-dev-secret-2026';
  }

  isConfigured(): boolean {
    return true; // Always operational in simulated mode
  }

  async initiateTransfer(params: InitiateTransferParams): Promise<InitiateTransferResult> {
    const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = String(Math.floor(1000 + Math.random() * 9000));
    const providerReferenceId = `KS-TXN-${todayStr}-${randomSuffix}`;

    if (params.simulateFailure) {
      return {
        providerReferenceId,
        state: 'FAILED',
        failureReason: 'SIM_ERR_GATEWAY_TIMEOUT: Bank gateway timeout during DBT transfer',
      };
    }

    const randomDigits = Math.floor(100000000000 + Math.random() * 900000000000);
    const utr = `${randomDigits}`;
    const dbtSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const dbtReferenceId = `DBT-${todayStr}-${dbtSuffix}`;

    return {
      providerReferenceId,
      state: 'SUCCESS',
      utr,
      dbtReferenceId,
    };
  }

  verifyWebhookSignature(payload: string | object, signature: string): boolean {
    if (!signature) return false;
    const expected = this.generateWebhookSignature(payload);
    try {
      const sigBuf = Buffer.from(signature, 'hex');
      const expBuf = Buffer.from(expected, 'hex');
      if (sigBuf.length !== expBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return signature === expected;
    }
  }

  generateWebhookSignature(payload: string | object): string {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha256', this.secret).update(data).digest('hex');
  }

  parseWebhookEvent(body: any, headers?: Record<string, any>): WebhookPayload {
    const eventId = body.eventId || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const eventType = body.eventType || 'PFMS.CREDIT_CONFIRMED';
    const providerReferenceId = body.providerReferenceId || body.transactionId || '';
    const state = body.state || (body.status === 'COMPLETED' ? 'SUCCESS' : body.status) || 'SUCCESS';

    return {
      eventId,
      eventType,
      provider: this.name,
      providerReferenceId,
      transactionId: body.transactionId,
      paymentId: body.paymentId,
      state,
      amount: body.amount,
      utr: body.utr,
      dbtReferenceId: body.dbtReferenceId,
      failureReason: body.failureReason,
      timestamp: body.timestamp || new Date().toISOString(),
    };
  }
}

export const simulatedPfmsAdapter = new SimulatedPfmsAdapter();
export default simulatedPfmsAdapter;
