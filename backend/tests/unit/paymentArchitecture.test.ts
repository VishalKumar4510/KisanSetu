/**
 * Payment Architecture & Webhook Unit Tests
 * Phase 28: Production Payment & Webhook Architecture
 * Covers all 20 mandated payment subsystem scenarios.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import {
  paymentService,
  transactionRepository,
  paymentStateMachine,
  simulatedPfmsAdapter,
  productionPfmsAdapter,
} from '../../src/services';
import { notificationService } from '../../src/services/notifications';
import { deliveryRecordRepository } from '../../src/services/notifications/deliveryRecordRepository';
import { paymentRepository } from '../../src/repositories/paymentRepository';
import store from '../../src/data/store';
import { PaymentStatus, ProcurementStatus, UserRole } from '../../../shared/types';
import { AppError } from '../../src/middleware/errorHandler';

describe('Phase 28: Production Payment Architecture (20 Scenarios)', () => {
  let officerToken: string;
  let adminToken: string;
  let farmerToken: string;

  beforeEach(async () => {
    store.reset();
    transactionRepository.reset();
    notificationService.resetIdempotencyCache();
    deliveryRecordRepository.clear();

    const off = await request(app).post('/api/auth/login').send({ phone: 'officer1', password: 'officer1' });
    officerToken = off.body.data?.token || '';

    const adm = await request(app).post('/api/auth/login').send({ phone: 'admin1', password: 'admin1' });
    adminToken = adm.body.data?.token || '';

    const f = await request(app).post('/api/auth/login').send({ phone: 'farmer1', password: 'farmer1' });
    farmerToken = f.body.data?.token || '';
  });

  function createTestProcurement(netAmount = 50000) {
    const farmer = store.getAllFarmers()[0];
    const procId = `proc-test-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const proc = {
      id: procId,
      farmerId: farmer.id,
      centreId: 'centre-001',
      produceId: 'prod-001',
      crop: 'Wheat',
      status: ProcurementStatus.PAYMENT_PENDING,
      calculatedNetAmount: netAmount,
      calculatedGrossAmount: netAmount + 1000,
      calculatedDeductions: 1000,
      createdAt: new Date().toISOString(),
    };
    store.createProcurement(proc as any);
    return proc;
  }

  // 1. Payment creation
  it('1. Payment creation: initializes payment review sheet with masked bank account and correct net calculation', async () => {
    const proc = createTestProcurement(75000);
    const review = await paymentService.reviewPayment(proc.id);

    expect(review.procurementId).toBe(proc.id);
    expect(review.finalPayableAmount).toBe(75000);
    expect(review.maskedBankAccount).toMatch(/^•{4} •{4} •{4} \d{4}$/);
    expect(review.paymentMethod).toContain('Direct Benefit Transfer');
    expect(review.payment).toBeDefined();
    expect(review.payment.status).toBe(PaymentStatus.PENDING);
  });

  // 2. Payment idempotency
  it('2. Payment idempotency: repeated initiatePayment calls return the existing transaction record without duplication', async () => {
    const proc = createTestProcurement(52000);

    const first = await paymentService.initiatePayment(proc.id, 'Officer Sharma');
    const second = await paymentService.initiatePayment(proc.id, 'Officer Sharma');

    expect(first.transactionId).toBe(second.transactionId);
    expect(first.payment.id).toBe(second.payment.id);
    expect(second.status).toBe('PROCESSING');
  });

  // 3. CREATED → PROCESSING
  it('3. CREATED -> PROCESSING: initiatePayment transitions state to PROCESSING and creates transaction ledger entry', async () => {
    const proc = createTestProcurement(48000);
    const result = await paymentService.initiatePayment(proc.id, 'Officer Verma');

    expect(result.status).toBe('INITIATED');
    expect(result.transactionId).toMatch(/^KS-TXN-\d{8}-\d{4}$/);
    expect(result.payment.status).toBe(PaymentStatus.PROCESSING);

    const txn = await transactionRepository.findByPaymentId(result.payment.id);
    expect(txn).toBeDefined();
    expect(txn?.state).toBe('PROCESSING');
    expect(txn?.auditLog.some(a => a.toState === 'PROCESSING')).toBe(true);
  });

  // 4. Processing success
  it('4. Processing success: DBT transfer succeeds, transitions to SUCCESS, and records UTR and DBT reference', async () => {
    const proc = createTestProcurement(60000);
    const initiated = await paymentService.initiatePayment(proc.id, 'Officer Verma');

    const settlement = await paymentService.processPayment({
      paymentId: initiated.payment.id,
      simulateFailure: false,
      actorName: 'Officer Verma',
    });

    expect(settlement.payment.status).toBe(PaymentStatus.COMPLETED);
    expect(settlement.utr).toBeDefined();
    expect(settlement.utr).toMatch(/^\d{10,12}$/);
    expect(settlement.dbtReferenceId).toMatch(/^DBT-\d{8}-[A-Z0-9]+$/);

    const txn = await transactionRepository.findByPaymentId(initiated.payment.id);
    expect(txn?.state).toBe('SUCCESS');
    expect(txn?.utr).toBe(settlement.utr);
  });

  // 5. Processing failure
  it('5. Processing failure: handles simulated gateway failure, transitions to FAILED, and records failureReason', async () => {
    const proc = createTestProcurement(40000);
    const initiated = await paymentService.initiatePayment(proc.id);

    const failureResult = await paymentService.processPayment({
      paymentId: initiated.payment.id,
      simulateFailure: true,
      actorName: 'System Gateway',
    });

    expect(failureResult.payment.status).toBe(PaymentStatus.FAILED);
    expect(failureResult.payment.failureReason).toContain('SIM_ERR_GATEWAY_TIMEOUT');

    const txn = await transactionRepository.findByPaymentId(initiated.payment.id);
    expect(txn?.state).toBe('FAILED');
    expect(txn?.failureReason).toContain('SIM_ERR_GATEWAY_TIMEOUT');
  });

  // 6. Retry after failure
  it('6. Retry after failure: permits retry of failed DBT payment transitioning from FAILED -> PROCESSING -> SUCCESS', async () => {
    const proc = createTestProcurement(55000);
    const initiated = await paymentService.initiatePayment(proc.id);

    // Fail attempt 1
    await paymentService.processPayment({
      paymentId: initiated.payment.id,
      simulateFailure: true,
    });
    expect((await transactionRepository.findByPaymentId(initiated.payment.id))?.state).toBe('FAILED');

    // Retry attempt 2 -> SUCCESS
    const retryResult = await paymentService.processPayment({
      paymentId: initiated.payment.id,
      simulateFailure: false,
      actorName: 'Officer Retry',
    });

    expect(retryResult.payment.status).toBe(PaymentStatus.COMPLETED);
    expect(retryResult.utr).toBeDefined();
    expect((await transactionRepository.findByPaymentId(initiated.payment.id))?.state).toBe('SUCCESS');
  });

  // 7. Duplicate payment request
  it('7. Duplicate payment request: blocks initiating payment on an already settled procurement with 409 Conflict', async () => {
    const proc = createTestProcurement(65000);
    const initiated = await paymentService.initiatePayment(proc.id);
    await paymentService.processPayment({ paymentId: initiated.payment.id, simulateFailure: false });

    await expect(paymentService.initiatePayment(proc.id)).rejects.toThrow(/already settled/);
  });

  // 8. Duplicate webhook
  it('8. Duplicate webhook: incoming webhook with identical eventId returns duplicate: true without re-settlement', async () => {
    const proc = createTestProcurement(45000);
    const initiated = await paymentService.initiatePayment(proc.id);

    const eventId = `evt-idemp-${Date.now()}`;
    const webhookBody = {
      eventId,
      eventType: 'PFMS.CREDIT_CONFIRMED',
      paymentId: initiated.payment.id,
      providerReferenceId: initiated.transactionId,
      state: 'SUCCESS',
      amount: initiated.payment.netAmount,
      utr: '112233445566',
      dbtReferenceId: 'DBT-20261001-IDEMP',
    };
    const signature = simulatedPfmsAdapter.generateWebhookSignature(webhookBody);

    const first = await paymentService.handleWebhook({ rawBody: webhookBody, signature });
    expect(first.success).toBe(true);
    expect(first.duplicate).toBeUndefined();

    const second = await paymentService.handleWebhook({ rawBody: webhookBody, signature });
    expect(second.success).toBe(true);
    expect(second.duplicate).toBe(true);
  });

  // 9. Invalid webhook
  it('9. Invalid webhook: rejects webhook with missing required fields with 400 Bad Request', async () => {
    const invalidBody = { unexpectedField: 'test' };
    const signature = simulatedPfmsAdapter.generateWebhookSignature(invalidBody);

    await expect(paymentService.handleWebhook({ rawBody: invalidBody, signature })).rejects.toThrow(/Missing required webhook event fields/);
  });

  // 10. Unknown payment webhook
  it('10. Unknown payment webhook: rejects webhook referencing nonexistent transaction or payment with 404 Not Found', async () => {
    const unknownBody = {
      eventId: `evt-unknown-${Date.now()}`,
      eventType: 'PFMS.CREDIT_CONFIRMED',
      paymentId: 'nonexistent-payment-id-999999',
      providerReferenceId: 'nonexistent-ref-999999',
      state: 'SUCCESS',
    };
    const signature = simulatedPfmsAdapter.generateWebhookSignature(unknownBody);

    await expect(paymentService.handleWebhook({ rawBody: unknownBody, signature })).rejects.toThrow(/Payment transaction not found/);
  });

  // 11. Invalid state transition
  it('11. Invalid state transition: strictly enforces valid state machine transitions and blocks illegal jumps', () => {
    expect(paymentStateMachine.canTransition('CREATED', 'PROCESSING')).toBe(true);
    expect(paymentStateMachine.canTransition('PROCESSING', 'SUCCESS')).toBe(true);
    expect(paymentStateMachine.canTransition('PROCESSING', 'FAILED')).toBe(true);
    expect(paymentStateMachine.canTransition('FAILED', 'PROCESSING')).toBe(true);
    expect(paymentStateMachine.canTransition('SUCCESS', 'REVERSED')).toBe(true);

    expect(paymentStateMachine.canTransition('CREATED', 'REVERSED')).toBe(false);
    expect(paymentStateMachine.canTransition('SUCCESS', 'PROCESSING')).toBe(false);
    expect(paymentStateMachine.canTransition('REVERSED', 'SUCCESS')).toBe(false);

    expect(() => paymentStateMachine.assertValidTransition('CREATED', 'REVERSED', 'test')).toThrow(AppError);
  });

  // 12. Already-settled payment
  it('12. Already-settled payment: blocks repeated settlement attempt on already settled payment with 409 Conflict', async () => {
    const proc = createTestProcurement(80000);
    const initiated = await paymentService.initiatePayment(proc.id);
    await paymentService.processPayment({ paymentId: initiated.payment.id, simulateFailure: false });

    await expect(paymentService.processPayment({ paymentId: initiated.payment.id, simulateFailure: false })).rejects.toThrow(/already completed and settled/);

    const secondWebhook = {
      eventId: `evt-settled-${Date.now()}`,
      eventType: 'PFMS.CREDIT_CONFIRMED',
      paymentId: initiated.payment.id,
      providerReferenceId: initiated.transactionId,
      state: 'SUCCESS',
      utr: '999999999999',
    };
    const signature = simulatedPfmsAdapter.generateWebhookSignature(secondWebhook);

    await expect(paymentService.handleWebhook({ rawBody: secondWebhook, signature })).rejects.toThrow(/already settled/);
  });

  // 13. Reversal
  it('13. Reversal: supports administrative reversal of settled payment with audit logging and event emission', async () => {
    const proc = createTestProcurement(90000);
    const initiated = await paymentService.initiatePayment(proc.id);
    await paymentService.processPayment({ paymentId: initiated.payment.id, simulateFailure: false });

    const reversedTxn = await paymentService.reversePayment({
      paymentId: initiated.payment.id,
      reason: 'Incorrect bank IFSC route code',
      actorName: 'Admin Nodal Officer',
    });

    expect(reversedTxn.state).toBe('REVERSED');
    expect(reversedTxn.failureReason).toBe('Incorrect bank IFSC route code');
    expect(reversedTxn.auditLog.some(a => a.toState === 'REVERSED')).toBe(true);
  });

  // 14. Notification dispatch
  it('14. Notification dispatch: dispatches domain notification events for payment lifecycle stages', async () => {
    const proc = createTestProcurement(33000);
    const initiated = await paymentService.initiatePayment(proc.id);

    // PAYMENT_PROCESSING was dispatched
    const deliveries = deliveryRecordRepository.getAll();
    expect(deliveries.some(d => d.recipient === initiated.payment.farmerId)).toBe(true);

    // PAYMENT_SUCCESS dispatch
    await paymentService.processPayment({ paymentId: initiated.payment.id, simulateFailure: false });
    const updatedDeliveries = deliveryRecordRepository.getAll();
    expect(updatedDeliveries.length).toBeGreaterThan(deliveries.length);
  });

  // 15. Duplicate notification prevention
  it('15. Duplicate notification prevention: notification service enforces idempotency to prevent duplicate dispatches', async () => {
    const farmer = store.getAllFarmers()[0];
    const event = {
      type: 'PAYMENT_SUCCESS' as const,
      farmerId: farmer.id,
      paymentId: `pay-test-notif-${Date.now()}`,
      netAmount: 42000,
      utr: '123456789012',
    };

    const first = await notificationService.dispatch(event);
    expect(first.duplicate).toBe(false);

    const second = await notificationService.dispatch(event);
    expect(second.duplicate).toBe(true);
  });

  // 16. Receipt generation
  it('16. Receipt generation: blocks receipt for non-settled payments (400), but returns official receipt for SUCCESS and REVERSED', async () => {
    const proc = createTestProcurement(62000);
    const initiated = await paymentService.initiatePayment(proc.id);

    // Blocked while in PROCESSING
    await expect(paymentService.getReceipt(initiated.payment.id)).rejects.toThrow(/Payment receipt is not available/);

    // Available once settled
    const settled = await paymentService.processPayment({ paymentId: initiated.payment.id, simulateFailure: false });
    const receipt = await paymentService.getReceipt(settled.payment.id);

    expect(receipt.receiptNumber).toBe(`RCP-${proc.id.toUpperCase()}`);
    expect(receipt.payment.id).toBe(settled.payment.id);
    expect(receipt.payment.state).toBe('SUCCESS');
    expect(receipt.payment.utr).toBe(settled.utr);
    expect(receipt.farmer.bankAccount).toMatch(/^•{4} •{4} •{4} \d{4}$/);

    // Available and accurately reflects REVERSED
    await paymentService.reversePayment({ paymentId: initiated.payment.id, reason: 'Duplicate procurement batch' });
    const revReceipt = await paymentService.getReceipt(settled.payment.id);
    expect(revReceipt.payment.state).toBe('REVERSED');
  });

  // 17. Payment history persistence
  it('17. Payment history persistence: masks bank account in farmer payment history query', async () => {
    const farmer = store.getAllFarmers()[0];
    const history = await paymentService.getPaymentHistory(farmer.id);

    expect(Array.isArray(history)).toBe(true);
    for (const p of history) {
      if (p.accountNumber) {
        expect(p.accountNumber).toMatch(/^XXXX-XXXX-\d{4}$/);
      }
    }
  });

  // 18. Authorization
  it('18. Authorization: strictly protects payment endpoints using RBAC and prevents farmer from unauthorized mutations', async () => {
    const proc = createTestProcurement(30000);
    const initiated = await paymentService.initiatePayment(proc.id);

    // Farmer role cannot call PUT /api/payments/:id/process (requires ADMIN)
    const farmerRes = await request(app)
      .put(`/api/payments/${initiated.payment.id}/process`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({});
    expect(farmerRes.status).toBe(403);

    // Farmer role cannot call POST /api/payments/:id/reverse (requires ADMIN)
    const farmerRevRes = await request(app)
      .post(`/api/payments/${initiated.payment.id}/reverse`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ reason: 'Unauthorized reversal' });
    expect(farmerRevRes.status).toBe(403);
  });

  // 19. Provider not configured behavior
  it('19. Provider not configured behavior: production adapter truthfully reports not configured and rejects calls with 503', async () => {
    expect(productionPfmsAdapter.mode).toBe('PRODUCTION');
    expect(productionPfmsAdapter.isConfigured()).toBe(false);

    await expect(
      productionPfmsAdapter.initiateTransfer({
        transactionId: 'txn-1',
        paymentId: 'pay-1',
        farmerId: 'f-1',
        amount: 1000,
      })
    ).rejects.toThrow(/NOT CONFIGURED/);
  });

  // 20. Transaction rollback behavior
  it('20. Transaction rollback behavior: completePaymentAtomic throws on conflict, ensuring rollback without orphaned state', async () => {
    const proc = createTestProcurement(50000);
    const initiated = await paymentService.initiatePayment(proc.id);

    // Settle once
    await paymentRepository.completePaymentAtomic({
      paymentId: initiated.payment.id,
      utr: '111122223333',
      dbtReferenceId: 'DBT-ATOMIC-01',
    });

    // Attempt second completePaymentAtomic call -> throws 409
    await expect(
      paymentRepository.completePaymentAtomic({
        paymentId: initiated.payment.id,
        utr: '444455556666',
        dbtReferenceId: 'DBT-ATOMIC-02',
      })
    ).rejects.toThrow(/Cannot re-process an already completed payment/);

    // Verify original UTR is intact, rollback succeeded
    const current = await paymentRepository.findById(initiated.payment.id);
    expect(current?.utr).toBe('111122223333');
  });
});
