import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import store from '../../src/data/store';
import { PaymentStatus, ProcurementStatus } from '../../../shared/types';

describe('Integration Tests: Payment & DBT Settlement Operations', () => {
  let farmerToken: string;
  let officerToken: string;
  let adminToken: string;

  beforeEach(async () => {
    store.reset();

    const f = await request(app).post('/api/auth/login').send({ phone: 'farmer1', password: 'farmer1' });
    farmerToken = f.body.data.token;

    const off = await request(app).post('/api/auth/login').send({ phone: 'officer1', password: 'officer1' });
    officerToken = off.body.data.token;

    const adm = await request(app).post('/api/auth/login').send({ phone: 'admin1', password: 'admin1' });
    adminToken = adm.body.data.token;
  });

  it('reviews calculated payment details and verifies banking information is masked', async () => {
    // Set up a procurement ready for payment review
    const proc = store.getAllProcurements()[0];
    store.updateProcurement(proc.id, {
      status: ProcurementStatus.PAYMENT_PENDING,
      calculatedNetAmount: 111475.0,
      calculatedGrossAmount: 113750.0,
      calculatedDeductions: 2275.0,
      calculatedBaseRate: 2275,
      calculatedAdjustment: 0,
    });

    const reviewRes = await request(app)
      .post('/api/officer/payment/review')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ procurementId: proc.id });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.success).toBe(true);
    expect(reviewRes.body.data.finalPayableAmount).toBe(111475.0);

    // Verify bank account masking (never expose full bank details)
    expect(reviewRes.body.data.maskedBankAccount).toMatch(/^•{4} •{4} •{4} \d{4}$/);
    expect(reviewRes.body.data.ifsc).toBeDefined();
    expect(reviewRes.body.data.paymentMethod).toContain('Direct Benefit Transfer');
  });

  it('initiates simulated DBT payment and advances status to PAYMENT_PROCESSING', async () => {
    const proc = store.getAllProcurements().find(p => p.status === ProcurementStatus.BOOKED)!;
    store.updateProcurement(proc.id, {
      status: ProcurementStatus.PAYMENT_PENDING,
      calculatedNetAmount: 50000,
      calculatedGrossAmount: 51020.4,
      calculatedDeductions: 1020.4,
    });

    const initRes = await request(app)
      .post('/api/officer/payment/initiate')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ procurementId: proc.id });

    expect(initRes.status).toBe(200);
    expect(initRes.body.success).toBe(true);
    expect(initRes.body.data.transactionId).toMatch(/^KS-TXN-\d{8}-\d{4}$/);
    expect(initRes.body.data.status).toBe('INITIATED');

    const payment = store.getPaymentByProcurement(proc.id);
    expect(payment).toBeDefined();
    expect(payment?.transactionId).toBe(initRes.body.data.transactionId);
  });

  it('simulates banking gateway failure and allows subsequent successful retry', async () => {
    const payment = store.getAllPayments()[0];
    expect(payment).toBeDefined();

    // 1. Simulate gateway failure -> returns 400 with failure details and sets status FAILED
    const failRes = await request(app)
      .post('/api/officer/payment/process')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ paymentId: payment.id, simulateFailure: true });

    expect(failRes.status).toBe(400);
    expect(failRes.body.data.payment.status).toBe(PaymentStatus.FAILED);
    expect(failRes.body.data.payment.failureReason).toContain('SIM_ERR_GATEWAY_TIMEOUT');

    // Verify status updated in store
    const failedPaymentInStore = store.getPaymentById(payment.id);
    expect(failedPaymentInStore?.status).toBe(PaymentStatus.FAILED);

    // 2. Retry and succeed -> returns 200 with COMPLETED status
    const retryRes = await request(app)
      .post('/api/officer/payment/process')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ paymentId: payment.id, simulateFailure: false });

    expect(retryRes.status).toBe(200);
    expect(retryRes.body.data.payment.status).toBe(PaymentStatus.COMPLETED);
    expect(retryRes.body.data.utr).toBeDefined();
    expect(retryRes.body.data.payment.utr).toBe(retryRes.body.data.utr);
  });

  it('rejects double-initiation of an already completed payment with 409 Conflict', async () => {
    // Find completed payment and ensure its procurement has calculatedNetAmount
    const completedPayment = store.getAllPayments().find(p => p.status === PaymentStatus.COMPLETED)!;
    expect(completedPayment).toBeDefined();

    store.updateProcurement(completedPayment.procurementId, {
      calculatedNetAmount: 85000,
    });

    const res = await request(app)
      .post('/api/officer/payment/initiate')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ procurementId: completedPayment.procurementId });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('Cannot initiate a second successful payment');
  });

  it('returns 404 Not Found for non-existent payment ID', async () => {
    const res = await request(app)
      .post('/api/officer/payment/process')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ paymentId: 'nonexistent-payment-99999' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Payment not found');
  });

  it('allows admin role to process DBT settlements via /api/payments/:id/process', async () => {
    const pendingPayment = store.getAllPayments().find(p => p.status !== PaymentStatus.COMPLETED)!;
    expect(pendingPayment).toBeDefined();

    const res = await request(app)
      .put(`/api/payments/${pendingPayment.id}/process`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(PaymentStatus.COMPLETED);
    expect(res.body.data.dbtReferenceId).toMatch(/^DBT-\d{8}-[A-Z0-9]+$/);
  });

  it('strictly blocks farmer role from processing or initiating payments (403 Forbidden)', async () => {
    const anyPayment = store.getAllPayments()[0];

    const farmerProcessRes = await request(app)
      .put(`/api/payments/${anyPayment.id}/process`)
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(farmerProcessRes.status).toBe(403);

    const farmerInitiateRes = await request(app)
      .post('/api/officer/payment/initiate')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ procurementId: anyPayment.procurementId });
    expect(farmerInitiateRes.status).toBe(403);
  });
});
