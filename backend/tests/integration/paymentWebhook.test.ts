/**
 * Payment Webhook & Endpoints Integration Tests
 * Phase 28: Production Payment & Webhook Architecture
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import store from '../../src/data/store';
import { simulatedPfmsAdapter, transactionRepository } from '../../src/services';
import { PaymentStatus, ProcurementStatus } from '../../../shared/types';

describe('Integration Tests: Payment Webhook & Architecture Endpoints', () => {
  let officerToken: string;
  let adminToken: string;
  let farmerToken: string;

  beforeEach(async () => {
    store.reset();
    transactionRepository.reset();

    const off = await request(app).post('/api/auth/login').send({ phone: 'officer1', password: 'officer1' });
    officerToken = off.body.data.token;

    const adm = await request(app).post('/api/auth/login').send({ phone: 'admin1', password: 'admin1' });
    adminToken = adm.body.data.token;

    const f = await request(app).post('/api/auth/login').send({ phone: 'farmer1', password: 'farmer1' });
    farmerToken = f.body.data.token;
  });

  function createTestProcurement() {
    const farmer = store.getAllFarmers()[0];
    const procId = `proc-wh-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const proc = {
      id: procId,
      farmerId: farmer.id,
      centreId: 'centre-001',
      produceId: 'prod-001',
      crop: 'Wheat',
      status: ProcurementStatus.PAYMENT_PENDING,
      calculatedNetAmount: 48000,
      calculatedGrossAmount: 49000,
      calculatedDeductions: 1000,
      createdAt: new Date().toISOString(),
    };
    store.createProcurement(proc as any);
    return proc;
  }

  it('settles payment via secure webhook callback with valid HMAC signature', async () => {
    const proc = createTestProcurement();

    // 1. Officer initiates payment
    const initRes = await request(app)
      .post('/api/officer/payment/initiate')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ procurementId: proc.id });

    expect(initRes.status).toBe(200);
    const paymentId = initRes.body.data.payment.id;
    const transactionId = initRes.body.data.transactionId;

    // 2. Incoming Webhook from Banking/PFMS Gateway
    const webhookBody = {
      eventId: `evt-wh-success-${Date.now()}`,
      eventType: 'PFMS.CREDIT_CONFIRMED',
      paymentId,
      providerReferenceId: transactionId,
      state: 'SUCCESS',
      amount: 48000,
      utr: '998877665544',
      dbtReferenceId: 'DBT-20261001-WH01',
    };

    const signature = simulatedPfmsAdapter.generateWebhookSignature(webhookBody);

    const whRes = await request(app)
      .post('/api/payments/webhook')
      .set('x-webhook-signature', signature)
      .send(webhookBody);

    expect(whRes.status).toBe(200);
    expect(whRes.body.success).toBe(true);
    expect(whRes.body.data.state).toBe('SUCCESS');
    expect(whRes.body.data.utr).toBe('998877665544');

    // 3. Verify Payment is now COMPLETED in store and has UTR
    const updatedPayment = store.getPaymentById(paymentId);
    expect(updatedPayment?.status).toBe(PaymentStatus.COMPLETED);
    expect(updatedPayment?.utr).toBe('998877665544');
  });

  it('rejects webhook without signature with 401 Unauthorized', async () => {
    const webhookBody = {
      eventId: 'evt-no-sig',
      state: 'SUCCESS',
      providerReferenceId: 'ref-1',
    };

    const res = await request(app)
      .post('/api/payments/webhook')
      .send(webhookBody);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Missing webhook signature');
  });

  it('rejects webhook with invalid signature with 401 Unauthorized', async () => {
    const webhookBody = {
      eventId: 'evt-bad-sig',
      state: 'SUCCESS',
      providerReferenceId: 'ref-1',
    };

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('x-webhook-signature', 'forged_fake_signature_hex')
      .send(webhookBody);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid webhook signature');
  });

  it('handles duplicate webhook event idempotently without re-crediting', async () => {
    const proc = createTestProcurement();

    const initRes = await request(app)
      .post('/api/officer/payment/initiate')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ procurementId: proc.id });

    const paymentId = initRes.body.data.payment.id;
    const transactionId = initRes.body.data.transactionId;

    const eventId = `evt-wh-idemp-${Date.now()}`;
    const webhookBody = {
      eventId,
      eventType: 'PFMS.CREDIT_CONFIRMED',
      paymentId,
      providerReferenceId: transactionId,
      state: 'SUCCESS',
      amount: 48000,
      utr: '123456789012',
    };

    const signature = simulatedPfmsAdapter.generateWebhookSignature(webhookBody);

    // First delivery -> 200 SUCCESS
    const firstRes = await request(app)
      .post('/api/payments/webhook')
      .set('x-webhook-signature', signature)
      .send(webhookBody);
    expect(firstRes.status).toBe(200);
    expect(firstRes.body.data.duplicate).toBeUndefined();

    // Second delivery -> 200 with duplicate flag
    const secondRes = await request(app)
      .post('/api/payments/webhook')
      .set('x-webhook-signature', signature)
      .send(webhookBody);
    expect(secondRes.status).toBe(200);
    expect(secondRes.body.data.duplicate).toBe(true);
    expect(secondRes.body.data.message).toContain('already processed');
  });

  it('generates official receipt via GET /api/payments/:id/receipt', async () => {
    const proc = createTestProcurement();
    const initRes = await request(app)
      .post('/api/officer/payment/initiate')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ procurementId: proc.id });

    const paymentId = initRes.body.data.payment.id;

    // Settle
    await request(app)
      .post('/api/officer/payment/process')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ paymentId, simulateFailure: false });

    // Fetch Receipt
    const receiptRes = await request(app)
      .get(`/api/payments/${paymentId}/receipt`)
      .set('Authorization', `Bearer ${farmerToken}`);

    expect(receiptRes.status).toBe(200);
    expect(receiptRes.body.success).toBe(true);
    expect(receiptRes.body.data.receiptNumber).toBe(`RCP-${proc.id.toUpperCase()}`);
    expect(receiptRes.body.data.payment.id).toBe(paymentId);
    expect(receiptRes.body.data.payment.state).toBe('SUCCESS');
    expect(receiptRes.body.data.farmer.bankAccount).toMatch(/^•{4} •{4} •{4} \d{4}$/);
  });

  it('retrieves transaction ledger and audit history via GET /api/payments/:id/transactions', async () => {
    const proc = createTestProcurement();
    const initRes = await request(app)
      .post('/api/officer/payment/initiate')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ procurementId: proc.id });

    const paymentId = initRes.body.data.payment.id;

    const auditRes = await request(app)
      .get(`/api/payments/${paymentId}/transactions`)
      .set('Authorization', `Bearer ${officerToken}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.success).toBe(true);
    expect(auditRes.body.data.paymentId).toBe(paymentId);
    expect(Array.isArray(auditRes.body.data.auditLog)).toBe(true);
    expect(auditRes.body.data.auditLog.length).toBeGreaterThanOrEqual(1);
  });
});
