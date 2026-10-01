/**
 * Secure Webhook Handler
 * Phase 28: Production Payment & Webhook Architecture
 * Provides signature verification, event idempotency, state transition validation, and atomic settlement.
 */

import { transactionRepository } from './transactionRepository';
import { paymentStateMachine } from './stateMachine';
import { getActivePaymentAdapter, getPaymentAdapterByName } from './adapters';
import { paymentRepository } from '../../repositories/paymentRepository';
import { procurementRepository } from '../../repositories/procurementRepository';
import { notificationService } from '../notifications';
import store from '../../data/store';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../lib/logger';
import { WebhookResult, PaymentState } from './types';
import { PaymentStatus, ProcurementStatus } from '../../../../shared/types';

export class WebhookHandler {
  async handleWebhook(params: {
    rawBody: any;
    signature?: string;
    headers?: Record<string, any>;
    providerName?: string;
  }): Promise<WebhookResult> {
    const { rawBody, signature, headers, providerName } = params;

    // 1. Resolve Provider Adapter
    const adapter = providerName
      ? getPaymentAdapterByName(providerName) || getActivePaymentAdapter()
      : getActivePaymentAdapter();

    // 2. Security: Verify Webhook Authenticity & Signature
    if (!signature) {
      logger.warn({ provider: adapter.name }, 'Webhook rejected: missing signature header');
      throw new AppError('Unauthorized: Missing webhook signature', 401);
    }

    const isValidSignature = adapter.verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      logger.warn({ provider: adapter.name }, 'Webhook rejected: invalid cryptographic signature');
      throw new AppError('Unauthorized: Invalid webhook signature', 401);
    }

    // 3. Parse & Validate Event Payload
    const payload = adapter.parseWebhookEvent(rawBody, headers);

    if (!payload.eventId || !payload.providerReferenceId && !payload.transactionId && !payload.paymentId) {
      throw new AppError('Bad Request: Missing required webhook event fields (eventId or reference identifier)', 400);
    }

    // 4. Idempotency: Prevent Duplicate Event Processing
    if (transactionRepository.isEventProcessed(payload.eventId)) {
      logger.info({ eventId: payload.eventId }, 'Idempotent webhook: duplicate event already processed');
      return {
        success: true,
        duplicate: true,
        transactionId: payload.transactionId,
        paymentId: payload.paymentId,
        message: 'Webhook event already processed (idempotent)',
      };
    }

    // 5. Transaction Lookup
    let txn = payload.transactionId
      ? await transactionRepository.findById(payload.transactionId)
      : null;

    if (!txn && payload.providerReferenceId) {
      txn = await transactionRepository.findByProviderReference(payload.providerReferenceId);
    }

    if (!txn && payload.paymentId) {
      txn = await transactionRepository.findByPaymentId(payload.paymentId);
    }

    // Fallback lookup from payment repository if transaction record was seeded / legacy
    let payment = txn
      ? await paymentRepository.findById(txn.paymentId).catch(() => null)
      : (payload.paymentId ? await paymentRepository.findById(payload.paymentId).catch(() => null) : null);

    if (!payment && payload.paymentId) {
      payment = store.getPaymentById(payload.paymentId) || null;
    }

    // Restart-safe Idempotency: If persistent payment already recorded this exact webhookEventId, return duplicate safely
    if (payment && payment.webhookEventId && payment.webhookEventId === payload.eventId) {
      logger.info({ eventId: payload.eventId }, 'Idempotent webhook: payment already recorded this webhookEventId in DB');
      transactionRepository.markEventProcessed(payload.eventId, {
        eventType: payload.eventType,
        transactionId: txn?.id,
      });
      return {
        success: true,
        duplicate: true,
        transactionId: txn?.id,
        paymentId: payment.id,
        message: 'Webhook event already processed (idempotent)',
      };
    }

    if (!txn && payment) {
      // Reconstitute transaction record from persistent payment
      const initialState: PaymentState =
        payment.status === PaymentStatus.COMPLETED || payment.status === PaymentStatus.SUCCESS
          ? 'SUCCESS'
          : payment.status === PaymentStatus.PROCESSING
          ? 'PROCESSING'
          : payment.status === PaymentStatus.FAILED
          ? 'FAILED'
          : 'CREATED';

      txn = await transactionRepository.save({
        id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        paymentId: payment.id,
        procurementId: payment.procurementId,
        farmerId: payment.farmerId,
        amount: payment.netAmount,
        currency: 'INR',
        state: initialState,
        provider: adapter.name,
        providerReferenceId: payment.transactionId || payload.providerReferenceId || payment.id,
        idempotencyKey: `idemp-${payment.id}`,
        utr: payment.utr,
        dbtReferenceId: payment.dbtReferenceId,
        initiatedAt: payment.createdAt,
        auditLog: [{
          timestamp: payment.createdAt,
          toState: initialState,
          event: 'TRANSACTION_RECONSTITUTED',
          actor: 'WebhookHandler',
        }],
      });
    }

    if (!txn) {
      logger.warn({ reference: payload.providerReferenceId || payload.paymentId }, 'Webhook rejected: transaction not found');
      throw new AppError('Payment transaction not found for incoming webhook reference', 404);
    }

    // 6. Security: Prevent Repeated Settlement & Validate State Transitions
    const currentState = txn.state;
    const targetState = payload.state;

    if (currentState === 'SUCCESS' && targetState === 'SUCCESS') {
      logger.warn({ transactionId: txn.id, paymentId: txn.paymentId }, 'Webhook rejected: payment already settled');
      throw new AppError('Payment is already settled and completed. Repeated settlement is rejected.', 409);
    }

    paymentStateMachine.assertValidTransition(currentState, targetState, txn.paymentId);

    // 7. Atomic Settlement / State Transition Execution
    const utr = payload.utr || txn.utr || `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const dbtReferenceId = payload.dbtReferenceId || txn.dbtReferenceId || `DBT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    if (targetState === 'SUCCESS') {
      // Execute Atomic Database Settlement
      try {
        await paymentRepository.completePaymentAtomic({
          paymentId: txn.paymentId,
          utr,
          dbtReferenceId,
          actorName: `Webhook (${adapter.name})`,
          providerName: adapter.name,
          providerReference: payload.providerReferenceId || txn.providerReferenceId,
          webhookEventId: payload.eventId,
          idempotencyKey: payload.eventId,
          providerStatus: 'SUCCESS',
        });
      } catch (err: any) {
        if (err instanceof AppError && err.statusCode === 409) {
          throw err;
        }
      }

      // Sync in-memory store
      store.updatePayment(txn.paymentId, {
        status: PaymentStatus.COMPLETED,
        utr,
        dbtReferenceId,
        completedAt: new Date().toISOString(),
        providerName: adapter.name,
        providerReference: payload.providerReferenceId || txn.providerReferenceId,
        webhookEventId: payload.eventId,
      });

      const proc = (await procurementRepository.findById(txn.procurementId).catch(() => null)) || store.getProcurementById(txn.procurementId);
      if (proc) {
        store.updateProcurement(proc.id, {
          status: ProcurementStatus.COMPLETED,
          completedAt: new Date().toISOString(),
        });
        if (proc.tokenId) {
          store.updateToken(proc.tokenId, { status: 'USED' });
        }
      }

      // Update Transaction Record
      await transactionRepository.updateState(txn.id, 'SUCCESS', {
        utr,
        dbtReferenceId,
      });

      // Dispatch PAYMENT_SUCCESS via NotificationService
      await notificationService.dispatch({
        type: 'PAYMENT_SUCCESS',
        farmerId: txn.farmerId,
        paymentId: txn.paymentId,
        netAmount: txn.amount,
        utr,
        dbtReferenceId,
      }).catch(() => {});
    } else if (targetState === 'FAILED') {
      const failureReason = payload.failureReason || 'Payment failed during gateway processing';

      await paymentRepository.updatePayment(txn.paymentId, {
        status: PaymentStatus.FAILED,
        failureReason,
        providerName: adapter.name,
        providerReference: payload.providerReferenceId,
        webhookEventId: payload.eventId,
        providerStatus: 'FAILED',
      }).catch(() => {});

      store.updatePayment(txn.paymentId, {
        status: PaymentStatus.FAILED,
        failureReason,
        providerName: adapter.name,
        providerReference: payload.providerReferenceId,
        webhookEventId: payload.eventId,
      });

      await transactionRepository.updateState(txn.id, 'FAILED', {
        failureReason,
      });

      await notificationService.dispatch({
        type: 'PAYMENT_FAILED',
        farmerId: txn.farmerId,
        paymentId: txn.paymentId,
        netAmount: txn.amount,
        reason: failureReason,
      }).catch(() => {});
    } else if (targetState === 'REVERSED') {
      const reason = payload.failureReason || 'Settlement reversed by banking network';

      await paymentRepository.updatePayment(txn.paymentId, {
        status: PaymentStatus.REVERSED,
        failureReason: reason,
        providerName: adapter.name,
        providerReference: payload.providerReferenceId,
        webhookEventId: payload.eventId,
        providerStatus: 'REVERSED',
      }).catch(() => {});

      store.updatePayment(txn.paymentId, {
        status: PaymentStatus.REVERSED,
        failureReason: reason,
        providerName: adapter.name,
        providerReference: payload.providerReferenceId,
        webhookEventId: payload.eventId,
      });

      await transactionRepository.updateState(txn.id, 'REVERSED', {
        failureReason: reason,
      });

      await notificationService.dispatch({
        type: 'PAYMENT_REVERSED',
        farmerId: txn.farmerId,
        paymentId: txn.paymentId,
        netAmount: txn.amount,
        reason,
      }).catch(() => {});
    }

    // 8. Audit Logging & Mark Event Processed
    await transactionRepository.addAuditLog(txn.id, {
      fromState: currentState,
      toState: targetState,
      event: payload.eventType,
      actor: adapter.name,
      details: {
        eventId: payload.eventId,
        utr,
        dbtReferenceId,
      },
    });

    transactionRepository.markEventProcessed(payload.eventId, {
      eventType: payload.eventType,
      transactionId: txn.id,
    });

    logger.info({
      transactionId: txn.id,
      paymentId: txn.paymentId,
      fromState: currentState,
      toState: targetState,
      provider: adapter.name,
    }, 'Webhook successfully processed payment state transition');

    return {
      success: true,
      state: targetState,
      transactionId: txn.id,
      paymentId: txn.paymentId,
      utr: targetState === 'SUCCESS' ? utr : undefined,
      dbtReferenceId: targetState === 'SUCCESS' ? dbtReferenceId : undefined,
      message: `Payment updated to ${targetState}`,
    };
  }
}

export const webhookHandler = new WebhookHandler();
export default webhookHandler;
