import { paymentRepository } from '../repositories/paymentRepository';
import { procurementRepository } from '../repositories/procurementRepository';
import { farmerRepository } from '../repositories/farmerRepository';
import { centreRepository } from '../repositories/centreRepository';
import { tokenRepository } from '../repositories/tokenRepository';
import store from '../data/store';
import { AppError } from '../middleware/errorHandler';
import { Payment, PaymentStatus, ProcurementStatus } from '../../../shared/types';
import { notificationService } from './notifications';
import {
  transactionRepository,
  paymentStateMachine,
  getActivePaymentAdapter,
  webhookHandler,
  PaymentTransaction,
  PaymentReceipt,
  WebhookResult,
  PaymentState,
} from './payments';
import logger from '../lib/logger';

export class PaymentService {
  /**
   * Get current active payment for an authenticated farmer (with masked bank details).
   */
  async getCurrentPayment(farmerId: string): Promise<Payment | null> {
    const payments = await paymentRepository.findByFarmerId(farmerId);
    const active = payments.find(p => p.status !== PaymentStatus.COMPLETED && p.status !== PaymentStatus.SUCCESS) || payments[0];
    if (active) return this.maskPaymentDetails(active);

    const storePayments = store.getPaymentsByFarmer(farmerId);
    const storeActive = storePayments.find(p => p.status !== PaymentStatus.COMPLETED && p.status !== PaymentStatus.SUCCESS) || storePayments[0];
    return storeActive ? this.maskPaymentDetails(storeActive) : null;
  }

  /**
   * Get payment history for an authenticated farmer.
   */
  async getPaymentHistory(farmerId: string): Promise<Payment[]> {
    const payments = await paymentRepository.findByFarmerId(farmerId);
    if (payments.length > 0) {
      return payments.map(p => this.maskPaymentDetails(p));
    }

    return store.getPaymentsByFarmer(farmerId).map(p => this.maskPaymentDetails(p));
  }

  /**
   * Get all payments (Admin / Officer view).
   */
  async getAllPayments(centreId?: string): Promise<Payment[]> {
    if (centreId) {
      const dbPayments = await paymentRepository.findByCentreId(centreId).catch(() => []);
      if (dbPayments.length > 0) return dbPayments;
      return store.getPaymentsByCentre(centreId);
    }
    const all = await paymentRepository.getAllPayments().catch(() => []);
    if (all.length > 0) return all;
    return store.getAllPayments();
  }

  /**
   * Get single payment by ID.
   */
  async getPaymentById(id: string): Promise<Payment | null> {
    const storePayment = store.getPaymentById(id);
    const dbPayment = await paymentRepository.findById(id).catch(() => null);
    if (storePayment && dbPayment) {
      if (storePayment.status !== dbPayment.status) {
        return storePayment;
      }
      return dbPayment;
    }
    return dbPayment || storePayment || null;
  }

  /**
   * Prepare payment review sheet for Officer review desk.
   */
  async reviewPayment(procurementId: string): Promise<any> {
    const storeProc = store.getProcurementById(procurementId);
    const dbProc = await procurementRepository.findById(procurementId).catch(() => null);
    const proc = (storeProc?.calculatedNetAmount ? storeProc : dbProc) || storeProc || dbProc;
    if (!proc) throw new AppError('Procurement not found', 404);

    const farmer = (await farmerRepository.findById(proc.farmerId).catch(() => null)) || store.getFarmerById(proc.farmerId);
    if (!farmer) throw new AppError('Farmer not found', 404);

    const weighing = (await procurementRepository.getWeighingByProcurementId(proc.id).catch(() => null)) || store.getWeighingByProcurement(proc.id);
    const quality = (await procurementRepository.getQualityCheckByProcurementId(proc.id).catch(() => null)) || store.getQualityCheckByProcurement(proc.id);

    const grossAmount = proc.calculatedGrossAmount || 0;
    const deductions = proc.calculatedDeductions || 0;
    const finalPayableAmount = proc.calculatedNetAmount ?? (grossAmount - deductions);
    const maskedBankAccount = farmer.bankAccount
      ? `•••• •••• •••• ${farmer.bankAccount.slice(-4)}`
      : '•••• •••• •••• 9842';

    const storePayment = store.getPaymentByProcurement(proc.id);
    const dbPayment = await paymentRepository.findByProcurementId(proc.id).catch(() => null);
    let payment = (storePayment && storePayment.status !== dbPayment?.status ? storePayment : dbPayment) || storePayment;
    if (!payment) {
      payment = await paymentRepository.createPayment({
        procurementId: proc.id,
        farmerId: farmer.id,
        grossAmount,
        deductions,
        netAmount: finalPayableAmount,
        status: PaymentStatus.PENDING,
      }).catch(() => null as any);

      if (!payment) {
        payment = {
          id: `pay-${Date.now()}`,
          procurementId: proc.id,
          farmerId: farmer.id,
          grossAmount,
          deductions,
          netAmount: finalPayableAmount,
          status: PaymentStatus.PENDING,
          createdAt: new Date().toISOString(),
        } as Payment;
      }
      store.createPayment(payment);
    }

    return {
      procurementId: proc.id,
      farmerId: farmer.farmerId || farmer.id,
      farmerName: farmer.name,
      crop: (proc as any).crop || 'Wheat',
      netQuantity: weighing?.netWeight || (proc as any).quantity || 50,
      grossAmount,
      deductions,
      finalPayableAmount,
      netAmount: finalPayableAmount,
      maskedBankAccount,
      bankName: farmer.bankName || 'State Bank of India',
      ifsc: farmer.ifsc || 'SBIN0001234',
      bankVerificationStatus: farmer.bankVerificationStatus || 'VERIFIED',
      paymentMethod: 'Direct Benefit Transfer (DBT via PFMS)',
      procurement: proc,
      farmer: {
        id: farmer.id,
        farmerId: farmer.farmerId,
        name: farmer.name,
        bankAccount: maskedBankAccount,
        maskedBankAccount,
        ifsc: farmer.ifsc || 'SBIN0001234',
        bankName: farmer.bankName || 'State Bank of India',
        bankVerificationStatus: farmer.bankVerificationStatus || 'VERIFIED',
      },
      weighing,
      qualityCheck: quality,
      payment,
    };
  }

  /**
   * Initiate DBT payment transfer:
   * Transitions state to PROCESSING, creates transaction record, and dispatches PAYMENT_PROCESSING event.
   */
  async initiatePayment(
    procurementId: string,
    officerName?: string
  ): Promise<{ payment: Payment; procurement: any; transactionId: string; status?: string }> {
    const proc = (await procurementRepository.findById(procurementId).catch(() => null)) || store.getProcurementById(procurementId);
    if (!proc) throw new AppError('Procurement not found', 404);

    const storePayment = store.getPaymentByProcurement(proc.id);
    const dbPayment = await paymentRepository.findByProcurementId(proc.id).catch(() => null);
    const existingPayment =
      (storePayment && storePayment.status !== dbPayment?.status ? storePayment : dbPayment) ||
      storePayment ||
      dbPayment;

    if (existingPayment && (existingPayment.status === PaymentStatus.COMPLETED || existingPayment.status === PaymentStatus.SUCCESS)) {
      throw new AppError('Cannot initiate a second successful payment for an already settled procurement', 409);
    }

    // Idempotency: If already in PROCESSING with a valid transactionId, return existing record
    if (existingPayment && existingPayment.status === PaymentStatus.PROCESSING && existingPayment.transactionId) {
      logger.info({ paymentId: existingPayment.id, transactionId: existingPayment.transactionId }, 'Idempotent initiatePayment: payment already in PROCESSING');
      return { payment: existingPayment, procurement: proc, transactionId: existingPayment.transactionId, status: 'PROCESSING' };
    }

    const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = String(Math.floor(1000 + Math.random() * 9000));
    const transactionId = `KS-TXN-${todayStr}-${randomSuffix}`;
    const adapter = getActivePaymentAdapter();

    let payment = existingPayment;
    if (!payment) {
      payment = await paymentRepository.createPayment({
        procurementId: proc.id,
        farmerId: proc.farmerId,
        grossAmount: proc.calculatedGrossAmount || 0,
        deductions: proc.calculatedDeductions || 0,
        netAmount: proc.calculatedNetAmount || 0,
        status: PaymentStatus.PROCESSING,
        transactionId,
        providerName: adapter.name,
        providerReference: transactionId,
        idempotencyKey: `init-${proc.id}-${transactionId}`,
        providerStatus: 'PROCESSING',
      }).catch(() => null as any);

      if (!payment) {
        payment = {
          id: `pay-${Date.now()}`,
          procurementId: proc.id,
          farmerId: proc.farmerId,
          grossAmount: proc.calculatedGrossAmount || 0,
          deductions: proc.calculatedDeductions || 0,
          netAmount: proc.calculatedNetAmount || 0,
          status: PaymentStatus.PROCESSING,
          transactionId,
          providerName: adapter.name,
          providerReference: transactionId,
          idempotencyKey: `init-${proc.id}-${transactionId}`,
          providerStatus: 'PROCESSING',
          createdAt: new Date().toISOString(),
        } as Payment;
      }
      store.createPayment(payment);
    } else {
      const updated = await paymentRepository.updatePayment(payment.id, {
        status: PaymentStatus.PROCESSING,
        transactionId,
        providerName: adapter.name,
        providerReference: transactionId,
        idempotencyKey: `init-${proc.id}-${transactionId}`,
        providerStatus: 'PROCESSING',
        processedAt: new Date().toISOString(),
      }).catch(() => null);
      if (updated) payment = { ...updated, transactionId };
      store.updatePayment(payment.id, {
        status: PaymentStatus.PROCESSING,
        transactionId,
        providerName: adapter.name,
        providerReference: transactionId,
        idempotencyKey: `init-${proc.id}-${transactionId}`,
        providerStatus: 'PROCESSING',
      });
    }

    // Register / update transaction record in transactionRepository
    const txnRecord: PaymentTransaction = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      paymentId: payment.id,
      procurementId: proc.id,
      farmerId: payment.farmerId,
      amount: payment.netAmount,
      currency: 'INR',
      state: 'PROCESSING',
      provider: adapter.name,
      providerReferenceId: transactionId,
      idempotencyKey: `init-${proc.id}-${transactionId}`,
      initiatedAt: new Date().toISOString(),
      auditLog: [
        {
          timestamp: new Date().toISOString(),
          fromState: 'CREATED',
          toState: 'PROCESSING',
          event: 'PAYMENT_INITIATED',
          actor: officerName || 'Mandi Officer',
          details: { transactionId, provider: adapter.name },
        },
      ],
    };
    await transactionRepository.save(txnRecord);

    await procurementRepository.updateProcurement(proc.id, {
      status: ProcurementStatus.PAYMENT_PROCESSING,
      paymentProcessingAt: new Date().toISOString(),
    }).catch(() => {});
    store.updateProcurement(proc.id, { status: ProcurementStatus.PAYMENT_PROCESSING });

    // Dispatch PAYMENT_PROCESSING event via NotificationService
    await notificationService.dispatch({
      type: 'PAYMENT_PROCESSING',
      farmerId: payment.farmerId,
      paymentId: payment.id,
      netAmount: payment.netAmount,
    }).catch(() => {});

    logger.info({
      paymentId: payment.id,
      procurementId: proc.id,
      transactionId,
      provider: adapter.name,
    }, 'Payment initiated and registered in transaction ledger');

    return { payment, procurement: proc, transactionId, status: 'INITIATED' };
  }

  /**
   * Complete payment settlement via atomic PostgreSQL transaction or provider adapter.
   */
  async processPayment(params: {
    paymentId: string;
    simulateFailure?: boolean;
    actorName?: string;
  }): Promise<{ payment: Payment; procurement: any; utr?: string; dbtReferenceId?: string }> {
    const { paymentId, simulateFailure = false, actorName = 'Mandi Officer' } = params;

    const payment = await this.getPaymentById(paymentId);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status === PaymentStatus.COMPLETED || payment.status === PaymentStatus.SUCCESS) {
      throw new AppError('Payment is already completed and settled', 409);
    }

    const adapter = getActivePaymentAdapter();
    let txn = await transactionRepository.findByPaymentId(payment.id);

    // If transaction record does not exist yet, initialize it
    if (!txn) {
      txn = await transactionRepository.save({
        id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        paymentId: payment.id,
        procurementId: payment.procurementId,
        farmerId: payment.farmerId,
        amount: payment.netAmount,
        currency: 'INR',
        state: payment.status === PaymentStatus.FAILED ? 'FAILED' : 'PROCESSING',
        provider: adapter.name,
        providerReferenceId: payment.transactionId || `KS-TXN-${Date.now()}`,
        idempotencyKey: `proc-${payment.id}-${Date.now()}`,
        initiatedAt: payment.createdAt,
        auditLog: [],
      });
    } else if (txn.state === 'SUCCESS') {
      txn.state = payment.status === PaymentStatus.FAILED ? 'FAILED' : 'PROCESSING';
      await transactionRepository.updateState(txn.id, txn.state);
    }

    // If transaction was previously FAILED, retrying transitions it back to PROCESSING first
    if (txn.state === 'FAILED') {
      paymentStateMachine.assertValidTransition(txn.state, 'PROCESSING', payment.id);
      await transactionRepository.updateState(txn.id, 'PROCESSING');
      await transactionRepository.addAuditLog(txn.id, {
        fromState: 'FAILED',
        toState: 'PROCESSING',
        event: 'PAYMENT_RETRY_INITIATED',
        actor: actorName,
      });
      txn.state = 'PROCESSING';
    }

    // Check state transition legality
    const targetState: PaymentState = simulateFailure ? 'FAILED' : 'SUCCESS';
    paymentStateMachine.assertValidTransition(txn.state, targetState, payment.id);

    // Call Provider Adapter
    const transferResult = await adapter.initiateTransfer({
      transactionId: txn.id,
      paymentId: payment.id,
      farmerId: payment.farmerId,
      amount: payment.netAmount,
      simulateFailure,
    });

    if (transferResult.state === 'FAILED' || simulateFailure) {
      const failureReason = transferResult.failureReason || 'SIM_ERR_GATEWAY_TIMEOUT: Bank gateway timeout during DBT transfer';

      const failedPayment = await paymentRepository.updatePayment(payment.id, {
        status: PaymentStatus.FAILED,
        failureReason,
      }).catch(() => null);

      store.updatePayment(payment.id, {
        status: PaymentStatus.FAILED,
        failureReason,
      });

      await transactionRepository.updateState(txn.id, 'FAILED', { failureReason });
      await transactionRepository.addAuditLog(txn.id, {
        fromState: txn.state,
        toState: 'FAILED',
        event: 'PAYMENT_FAILED',
        actor: actorName,
        details: { failureReason },
      });

      // Dispatch PAYMENT_FAILED event via NotificationService
      await notificationService.dispatch({
        type: 'PAYMENT_FAILED',
        farmerId: payment.farmerId,
        paymentId: payment.id,
        netAmount: payment.netAmount,
        reason: failureReason,
      }).catch(() => {});

      return {
        payment: failedPayment || {
          ...payment,
          status: PaymentStatus.FAILED,
          failureReason,
        },
        procurement: null,
      };
    }

    // Success settlement path
    const utr = transferResult.utr || `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const dbtReferenceId = transferResult.dbtReferenceId || `DBT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Execute Atomic PostgreSQL Transaction (Phase 18 transaction boundary)
    let settlement: any = null;
    try {
      settlement = await paymentRepository.completePaymentAtomic({
        paymentId: payment.id,
        utr,
        dbtReferenceId,
        actorName,
      });
    } catch (err: any) {
      if (err instanceof AppError && err.statusCode === 409) throw err;
      // In-memory or sandbox fallback
    }

    // Update store state for compatibility
    store.updatePayment(payment.id, {
      status: PaymentStatus.COMPLETED,
      utr,
      dbtReferenceId,
      completedAt: new Date().toISOString(),
    });

    const updatedProc =
      (await procurementRepository.findById(payment.procurementId).catch(() => null)) ||
      store.getProcurementById(payment.procurementId);

    if (updatedProc) {
      store.updateProcurement(updatedProc.id, {
        status: ProcurementStatus.COMPLETED,
        completedAt: new Date().toISOString(),
      });
      if (updatedProc.tokenId) {
        store.updateToken(updatedProc.tokenId, { status: 'USED' });
      }
    }

    // Update Transaction Ledger & Audit Trail
    await transactionRepository.updateState(txn.id, 'SUCCESS', { utr, dbtReferenceId });
    await transactionRepository.addAuditLog(txn.id, {
      fromState: txn.state,
      toState: 'SUCCESS',
      event: 'PAYMENT_SETTLED',
      actor: actorName,
      details: { utr, dbtReferenceId },
    });

    // Dispatch PAYMENT_SUCCESS event via central NotificationService
    await notificationService.dispatch({
      type: 'PAYMENT_SUCCESS',
      farmerId: payment.farmerId,
      paymentId: payment.id,
      netAmount: payment.netAmount,
      utr,
      dbtReferenceId,
    }).catch(() => {});

    const updatedPayment = settlement?.payment || store.getPaymentById(payment.id) || {
      ...payment,
      status: PaymentStatus.COMPLETED,
      utr,
      dbtReferenceId,
    };

    return {
      payment: updatedPayment,
      procurement: updatedProc || undefined,
      utr,
      dbtReferenceId,
    };
  }

  /**
   * Process incoming Webhook from banking/PFMS provider.
   */
  async handleWebhook(params: {
    rawBody: any;
    signature?: string;
    headers?: Record<string, any>;
    providerName?: string;
  }): Promise<WebhookResult> {
    return webhookHandler.handleWebhook(params);
  }

  /**
   * Retrieve official payment receipt.
   */
  async getReceipt(paymentIdOrProcurementId: string): Promise<PaymentReceipt> {
    let payment = await this.getPaymentById(paymentIdOrProcurementId);
    let proc = null;

    if (!payment) {
      payment = (await paymentRepository.findByProcurementId(paymentIdOrProcurementId).catch(() => null)) ||
        store.getPaymentByProcurement(paymentIdOrProcurementId);
      proc = (await procurementRepository.findById(paymentIdOrProcurementId).catch(() => null)) ||
        store.getProcurementById(paymentIdOrProcurementId);
    } else {
      proc = (await procurementRepository.findById(payment.procurementId).catch(() => null)) ||
        store.getProcurementById(payment.procurementId);
    }

    if (!payment || !proc) {
      throw new AppError('Payment or procurement record not found for receipt generation', 404);
    }

    if (
      payment.status !== PaymentStatus.COMPLETED &&
      payment.status !== PaymentStatus.SUCCESS &&
      payment.status !== PaymentStatus.REVERSED
    ) {
      throw new AppError('Payment receipt is not available until payment is settled or reversed', 400);
    }

    const farmer = (await farmerRepository.findById(proc.farmerId).catch(() => null)) || store.getFarmerById(proc.farmerId);
    const centre = (await centreRepository.findById(proc.centreId).catch(() => null)) || store.getCentreById(proc.centreId);
    const weighing = (await procurementRepository.getWeighingByProcurementId(proc.id).catch(() => null)) || store.getWeighingByProcurement(proc.id);
    const quality = (await procurementRepository.getQualityCheckByProcurementId(proc.id).catch(() => null)) || store.getQualityCheckByProcurement(proc.id);
    const token = proc.tokenId ? ((await tokenRepository.findById(proc.tokenId).catch(() => null)) || store.getTokenById(proc.tokenId)) : null;

    const maskedAccount = farmer?.bankAccount
      ? `•••• •••• •••• ${farmer.bankAccount.slice(-4)}`
      : '•••• •••• •••• 9842';

    const paymentState: PaymentState =
      payment.status === PaymentStatus.REVERSED
        ? 'REVERSED'
        : payment.status === PaymentStatus.COMPLETED || payment.status === PaymentStatus.SUCCESS
        ? 'SUCCESS'
        : (payment.status as any);

    return {
      receiptNumber: `RCP-${proc.id.toUpperCase()}`,
      issuedAt: payment.completedAt || proc.completedAt || new Date().toISOString(),
      payment: {
        id: payment.id,
        status: payment.status,
        state: paymentState,
        grossAmount: payment.grossAmount,
        deductions: payment.deductions,
        netAmount: payment.netAmount,
        utr: payment.utr,
        dbtReferenceId: payment.dbtReferenceId,
        paymentMethod: payment.paymentMethod || 'Direct Benefit Transfer (DBT via PFMS)',
        processedAt: payment.processedAt,
      },
      procurement: proc,
      farmer: {
        ...farmer,
        bankAccount: maskedAccount,
      },
      centre,
      token,
      weighing,
      qualityCheck: quality,
    };
  }

  /**
   * Get transaction history and audit log for a payment.
   */
  async getTransactionHistory(paymentId: string): Promise<PaymentTransaction | null> {
    return transactionRepository.findByPaymentId(paymentId);
  }

  /**
   * Reverse a settled payment (reversal only allowed from SUCCESS state).
   */
  async reversePayment(params: {
    paymentId: string;
    reason: string;
    actorName?: string;
  }): Promise<PaymentTransaction> {
    const { paymentId, reason, actorName = 'Mandi Admin' } = params;
    const payment = await this.getPaymentById(paymentId);
    if (!payment) throw new AppError('Payment not found', 404);

    let txn = await transactionRepository.findByPaymentId(payment.id);
    const currentState: PaymentState = txn ? txn.state : (payment.status === PaymentStatus.COMPLETED ? 'SUCCESS' : 'FAILED');

    paymentStateMachine.assertValidTransition(currentState, 'REVERSED', payment.id);

    if (!txn) {
      txn = await transactionRepository.save({
        id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        paymentId: payment.id,
        procurementId: payment.procurementId,
        farmerId: payment.farmerId,
        amount: payment.netAmount,
        currency: 'INR',
        state: 'SUCCESS',
        provider: 'PFMS_SIMULATED',
        providerReferenceId: payment.transactionId || payment.id,
        idempotencyKey: `rev-${payment.id}`,
        initiatedAt: payment.createdAt,
        auditLog: [],
      });
    }

    await paymentRepository.updatePayment(payment.id, {
      status: PaymentStatus.REVERSED,
      failureReason: `Reversed: ${reason}`,
    }).catch(() => {});

    store.updatePayment(payment.id, {
      status: PaymentStatus.REVERSED,
      failureReason: `Reversed: ${reason}`,
    });

    const updatedTxn = await transactionRepository.updateState(txn.id, 'REVERSED', {
      failureReason: reason,
    });

    await transactionRepository.addAuditLog(txn.id, {
      fromState: currentState,
      toState: 'REVERSED',
      event: 'PAYMENT_REVERSED',
      actor: actorName,
      details: { reason },
    });

    // Dispatch PAYMENT_REVERSED event via NotificationService
    await notificationService.dispatch({
      type: 'PAYMENT_REVERSED',
      farmerId: payment.farmerId,
      paymentId: payment.id,
      netAmount: payment.netAmount,
      reason,
    }).catch(() => {});

    return updatedTxn!;
  }

  /**
   * Mask banking account numbers for secure client transmission.
   */
  private maskPaymentDetails(payment: Payment): Payment {
    return {
      ...payment,
      accountNumber: payment.accountNumber ? `XXXX-XXXX-${payment.accountNumber.slice(-4)}` : undefined,
    };
  }
}

export const paymentService = new PaymentService();
export default paymentService;
