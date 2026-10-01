/**
 * Payment Transaction Repository
 * In-memory & DB transaction record registry with idempotency & audit tracking.
 * Phase 28: Production Payment & Webhook Architecture
 */

import { PaymentTransaction, PaymentAuditEntry, PaymentState } from './types';
import logger from '../../lib/logger';

export class TransactionRepository {
  private transactions: Map<string, PaymentTransaction> = new Map();
  private processedEvents: Map<string, { processedAt: string; eventType: string; transactionId?: string }> = new Map();

  async save(txn: PaymentTransaction): Promise<PaymentTransaction> {
    this.transactions.set(txn.id, { ...txn });
    return { ...txn };
  }

  async findById(id: string): Promise<PaymentTransaction | null> {
    const txn = this.transactions.get(id);
    return txn ? { ...txn } : null;
  }

  async findByPaymentId(paymentId: string): Promise<PaymentTransaction | null> {
    for (const txn of this.transactions.values()) {
      if (txn.paymentId === paymentId) {
        return { ...txn };
      }
    }
    return null;
  }

  async findByProviderReference(ref: string): Promise<PaymentTransaction | null> {
    for (const txn of this.transactions.values()) {
      if (txn.providerReferenceId === ref) {
        return { ...txn };
      }
    }
    return null;
  }

  async findByIdempotencyKey(key: string): Promise<PaymentTransaction | null> {
    for (const txn of this.transactions.values()) {
      if (txn.idempotencyKey === key) {
        return { ...txn };
      }
    }
    return null;
  }

  isEventProcessed(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  markEventProcessed(eventId: string, details: { eventType: string; transactionId?: string }): void {
    this.processedEvents.set(eventId, {
      processedAt: new Date().toISOString(),
      ...details,
    });
  }

  async addAuditLog(
    transactionId: string,
    entry: Omit<PaymentAuditEntry, 'timestamp'>
  ): Promise<PaymentTransaction | null> {
    const txn = this.transactions.get(transactionId);
    if (!txn) return null;

    const fullEntry: PaymentAuditEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    txn.auditLog.push(fullEntry);
    this.transactions.set(transactionId, txn);

    logger.info({
      transactionId,
      paymentId: txn.paymentId,
      fromState: fullEntry.fromState,
      toState: fullEntry.toState,
      event: fullEntry.event,
      actor: fullEntry.actor,
    }, 'Payment transaction state audit logged');

    return { ...txn };
  }

  async updateState(
    transactionId: string,
    state: PaymentState,
    updates?: Partial<PaymentTransaction>
  ): Promise<PaymentTransaction | null> {
    const txn = this.transactions.get(transactionId);
    if (!txn) return null;

    const updated: PaymentTransaction = {
      ...txn,
      ...updates,
      state,
      settledAt: state === 'SUCCESS' ? new Date().toISOString() : txn.settledAt,
    };

    this.transactions.set(transactionId, updated);
    return { ...updated };
  }

  getAll(): PaymentTransaction[] {
    return Array.from(this.transactions.values()).map(t => ({ ...t }));
  }

  reset(): void {
    this.transactions.clear();
    this.processedEvents.clear();
  }
}

export const transactionRepository = new TransactionRepository();
export default transactionRepository;
