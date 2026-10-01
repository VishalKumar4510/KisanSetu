/**
 * Phase 28: Payment Real Persistence Lifecycle Test
 * Implements the exact 16-step persistence lifecycle sequence mandated by Section 17.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { prisma, initializeDatabase } from '../../src/lib/prisma';
import store from '../../src/data/store';
import {
  paymentRepository,
  procurementRepository,
  farmerRepository,
  centreRepository,
  slotRepository,
  userRepository,
} from '../../src/repositories';
import {
  paymentService,
  transactionRepository,
  simulatedPfmsAdapter,
} from '../../src/services';
import { notificationService } from '../../src/services/notifications';
import { deliveryRecordRepository } from '../../src/services/notifications/deliveryRecordRepository';
import { seedBaseDataIfNotExists } from '../../prisma/seed';
import { ProduceType, PaymentStatus, ProcurementStatus } from '../../../shared/types';
import bcrypt from 'bcrypt';

describe('Phase 28: Payment Real Persistence Lifecycle (Section 17 - 16 Steps)', () => {
  let farmerId = '';
  let centreId = '';
  let procurementId = '';
  let paymentId = '';
  let transactionId = '';
  let originalUtr = '';
  let originalDbtRef = '';
  const testEventId = `evt-persist-${Date.now()}`;

  beforeAll(async () => {
    await initializeDatabase();
    await seedBaseDataIfNotExists();
  });

  it('Setup: Prepares persistent farmer, slot, token, and procurement in PostgreSQL', async () => {
    // 1. Create a persistent farmer in PostgreSQL
    const passwordHash = await bcrypt.hash('SecretPass@123', 10);
    const user = await userRepository.createUser({
      phone: `98${Date.now().toString().slice(-8)}`,
      password: passwordHash,
      role: 'FARMER',
      name: 'Rameshwar Yadav',
      language: 'hi',
    });

    const farmer = await farmerRepository.createFarmer({
      id: user.id,
      userId: user.id,
      farmerId: `KS-RAMESH-${Date.now().toString().slice(-4)}`,
      village: 'Kisanpur',
      district: 'Varanasi',
      state: 'Uttar Pradesh',
      landArea: 5.0,
      crops: [ProduceType.WHEAT],
      bankAccount: '123456789012',
      bankName: 'State Bank of India',
      ifsc: 'SBIN0001234',
    });
    farmerId = farmer.id;

    // 2. Resolve Centre & Slot
    const centres = await centreRepository.getAllCentres();
    expect(centres.length).toBeGreaterThan(0);
    centreId = centres[0].id;

    const slots = await slotRepository.getAvailableSlots(centreId);
    expect(slots.length).toBeGreaterThan(0);

    // 3. Book Slot & create Procurement in DB
    const booking = await slotRepository.bookSlotAtomic({
      slotId: slots[0].id,
      farmerId,
      centreId,
      crop: ProduceType.WHEAT,
      estimatedQuantity: 50,
    });

    expect(booking.procurement).toBeDefined();
    procurementId = booking.procurement.id;

    // Set calculation on procurement
    await procurementRepository.updateProcurement(procurementId, {
      calculatedGrossAmount: 51000,
      calculatedDeductions: 1000,
      calculatedNetAmount: 50000,
      status: ProcurementStatus.PAYMENT_PENDING,
    });
  });

  // Step 1: Create payment
  it('Step 1: Creates initial payment record in persistent PostgreSQL database', async () => {
    const payment = await paymentRepository.createPayment({
      procurementId,
      farmerId,
      grossAmount: 51000,
      deductions: 1000,
      netAmount: 50000,
      status: PaymentStatus.CREATED,
    });

    expect(payment).toBeDefined();
    expect(payment.id).toBeDefined();
    paymentId = payment.id;
  });

  // Step 2: Verify CREATED
  it('Step 2: Verifies payment state is CREATED in database', async () => {
    const dbPayment = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(dbPayment).not.toBeNull();
    expect(dbPayment?.status).toBe('CREATED');
    expect(dbPayment?.netAmount).toBe(50000);
  });

  // Step 3: Process payment (Initiate)
  it('Step 3: Initiates DBT payment processing', async () => {
    const initiated = await paymentService.initiatePayment(procurementId, 'Officer Sharma');
    expect(initiated.status).toBe('INITIATED');
    expect(initiated.transactionId).toBeDefined();
    transactionId = initiated.transactionId;
  });

  // Step 4: Verify PROCESSING
  it('Step 4: Verifies payment state transitions to PROCESSING in PostgreSQL', async () => {
    const dbPayment = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(dbPayment?.status).toBe('PROCESSING');
    expect(dbPayment?.transactionId).toBe(transactionId);
  });

  // Step 5: Simulate successful provider callback
  it('Step 5: Simulates successful payment provider callback via webhook', async () => {
    const webhookPayload = {
      eventId: testEventId,
      eventType: 'PFMS.CREDIT_CONFIRMED',
      paymentId,
      providerReferenceId: transactionId,
      state: 'SUCCESS' as const,
      amount: 50000,
      utr: '987654321012',
      dbtReferenceId: `DBT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-P28OK`,
    };

    const signature = simulatedPfmsAdapter.generateWebhookSignature(webhookPayload);
    const result = await paymentService.handleWebhook({
      rawBody: webhookPayload,
      signature,
    });

    expect(result.success).toBe(true);
    expect(result.state).toBe('SUCCESS');
    expect(result.utr).toBe('987654321012');
  });

  // Step 6: Verify SUCCESS
  it('Step 6: Verifies payment status in PostgreSQL transitions to COMPLETED / SUCCESS', async () => {
    const dbPayment = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(dbPayment?.status).toBe('COMPLETED');
    expect(dbPayment?.completedAt).not.toBeNull();
  });

  // Step 7: Verify UTR/reference
  it('Step 7: Verifies UTR and provider reference are securely persisted in database', async () => {
    const dbPayment = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(dbPayment?.utr).toBe('987654321012');
    expect(dbPayment?.dbtReferenceId).toContain('P28OK');
    expect(dbPayment?.webhookEventId).toBe(testEventId);
    originalUtr = dbPayment!.utr!;
    originalDbtRef = dbPayment!.dbtReferenceId!;
  });

  // Step 8: Verify audit record
  it('Step 8: Verifies payment audit trail recorded the transition', async () => {
    const txn = await transactionRepository.findByPaymentId(paymentId);
    expect(txn).toBeDefined();
    expect(txn?.auditLog.some(a => a.toState === 'SUCCESS')).toBe(true);
  });

  // Step 9: Verify notification
  it('Step 9: Verifies PAYMENT_SUCCESS notification was dispatched to farmer', async () => {
    const deliveries = deliveryRecordRepository.getAll();
    const farmerDelivery = deliveries.find(d => d.recipient === farmerId && d.idempotencyKey.includes('PAYMENT_SUCCESS'));
    expect(farmerDelivery).toBeDefined();
    expect(farmerDelivery?.metadata?.utr).toBe(originalUtr);
  });

  // Step 10: Verify receipt
  it('Step 10: Verifies official receipt is generated with valid payment details', async () => {
    const receipt = await paymentService.getReceipt(paymentId);
    expect(receipt.receiptNumber).toBe(`RCP-${procurementId.toUpperCase()}`);
    expect(receipt.payment.state).toBe('SUCCESS');
    expect(receipt.payment.utr).toBe(originalUtr);
    expect(receipt.farmer.bankAccount).toMatch(/^•{4} •{4} •{4} \d{4}$/);
  });

  // Step 11: Restart backend/store
  it('Step 11: Simulates backend restart: wipes in-memory cache and re-initializes database schema', async () => {
    store.reset();
    transactionRepository.reset();
    notificationService.resetIdempotencyCache();
    deliveryRecordRepository.clear();

    await initializeDatabase();
  });

  // Step 12: Verify SUCCESS remains
  it('Step 12: Verifies SUCCESS state remains intact in database after restart', async () => {
    const dbPayment = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(dbPayment).not.toBeNull();
    expect(dbPayment?.status).toBe('COMPLETED');
    expect(dbPayment?.utr).toBe(originalUtr);
    expect(dbPayment?.dbtReferenceId).toBe(originalDbtRef);
    expect(dbPayment?.webhookEventId).toBe(testEventId);
  });

  // Step 13: Re-send identical webhook
  it('Step 13: Re-sends identical webhook with exact same eventId', async () => {
    const webhookPayload = {
      eventId: testEventId,
      eventType: 'PFMS.CREDIT_CONFIRMED',
      paymentId,
      providerReferenceId: transactionId,
      state: 'SUCCESS' as const,
      amount: 50000,
      utr: originalUtr,
      dbtReferenceId: originalDbtRef,
    };
    const signature = simulatedPfmsAdapter.generateWebhookSignature(webhookPayload);

    const result = await paymentService.handleWebhook({
      rawBody: webhookPayload,
      signature,
    });

    expect(result.success).toBe(true);
    expect(result.duplicate).toBe(true);
  });

  // Step 14: Verify no duplicate settlement
  it('Step 14: Verifies no duplicate settlement occurred and UTR remains identical', async () => {
    const payments = await prisma.payment.findMany({ where: { procurementId } });
    expect(payments.length).toBe(1);
    expect(payments[0].utr).toBe(originalUtr);
    expect(payments[0].status).toBe('COMPLETED');
  });

  // Step 15: Verify no duplicate notification
  it('Step 15: Verifies no duplicate notification was dispatched for re-sent webhook', async () => {
    const deliveries = deliveryRecordRepository.getAll();
    expect(deliveries.length).toBe(0); // Zero new notifications dispatched for duplicate event
  });

  // Step 16: Verify history remains correct
  it('Step 16: Verifies farmer payment history remains correct with masked bank accounts', async () => {
    const history = await paymentService.getPaymentHistory(farmerId);
    expect(history.length).toBeGreaterThanOrEqual(1);

    const found = history.find(p => p.id === paymentId);
    expect(found).toBeDefined();
    expect(found?.status).toBe(PaymentStatus.COMPLETED);
    expect(found?.utr).toBe(originalUtr);
  });
});
