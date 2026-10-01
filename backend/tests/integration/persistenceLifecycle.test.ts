import { describe, it, expect, beforeAll } from 'vitest';
import { prisma, initializeDatabase } from '../../src/lib/prisma';
import store from '../../src/data/store';
import {
  userRepository,
  farmerRepository,
  slotRepository,
  tokenRepository,
  procurementRepository,
  paymentRepository,
  centreRepository,
} from '../../src/repositories';
import { officerService } from '../../src/services/officerService';
import { queueService } from '../../src/services/queueService';
import { procurementService } from '../../src/services/procurementService';
import { paymentService } from '../../src/services/paymentService';
import { seedBaseDataIfNotExists } from '../../prisma/seed';
import { ProduceType, PaymentStatus, ProcurementStatus } from '../../../shared/types';
import bcrypt from 'bcrypt';

describe('Phase 23 Real Persistence Verification Lifecycle', () => {
  const uniquePhone = `99${Date.now().toString().slice(-8)}`;
  const uniqueFarmerId = `KS-PERSIST-${Date.now().toString().slice(-4)}`;
  let testUserId = '';
  let testFarmerId = '';
  let testSlotId = '';
  let testCentreId = '';
  let testTokenId = '';
  let testProcurementId = '';
  let testPaymentId = '';

  beforeAll(async () => {
    await seedBaseDataIfNotExists();
  });

  it('Step 1 & 2: Registers a new persistent farmer user directly into PostgreSQL', async () => {
    const passwordHash = await bcrypt.hash('TestPass@123', 10);
    const user = await userRepository.createUser({
      phone: uniquePhone,
      password: passwordHash,
      role: 'FARMER',
      name: 'Persistent Farmer Test',
      language: 'en',
    });

    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    testUserId = user.id;

    const farmer = await farmerRepository.createFarmer({
      id: testUserId,
      userId: testUserId,
      farmerId: uniqueFarmerId,
      village: 'Kisanpur',
      district: 'Ayodhya',
      state: 'Uttar Pradesh',
      landArea: 6.5,
      crops: [ProduceType.WHEAT],
      bankAccount: '112233445566',
      bankName: 'Punjab National Bank',
      ifsc: 'PUNB0123400',
    });

    expect(farmer).toBeDefined();
    expect(farmer.farmerId).toBe(uniqueFarmerId);
    testFarmerId = farmer.id;

    // Verify farmer exists in PostgreSQL
    const dbFarmer = await prisma.farmer.findUnique({
      where: { id: testFarmerId },
      include: { user: true },
    });
    expect(dbFarmer).not.toBeNull();
    expect(dbFarmer?.user?.name).toBe('Persistent Farmer Test');
  });

  it('Step 3 & 4: Books a slot, creates token and procurement atomically in PostgreSQL', async () => {
    const centres = await centreRepository.getAllCentres();
    expect(centres.length).toBeGreaterThan(0);
    testCentreId = centres[0].id;

    const slots = await slotRepository.getAvailableSlots(testCentreId);
    expect(slots.length).toBeGreaterThan(0);
    testSlotId = slots[0].id;

    const bookingResult = await slotRepository.bookSlotAtomic({
      slotId: testSlotId,
      farmerId: testFarmerId,
      centreId: testCentreId,
      crop: ProduceType.WHEAT,
      estimatedQuantity: 50,
    });

    expect(bookingResult).toBeDefined();
    expect(bookingResult.token).toBeDefined();
    expect(bookingResult.token.status).toBe('ACTIVE');
    testTokenId = bookingResult.token.id;
    testProcurementId = bookingResult.procurement.id;

    // Verify token exists directly in database table
    const dbToken = await prisma.token.findUnique({ where: { id: testTokenId } });
    expect(dbToken).not.toBeNull();
    expect(dbToken?.status).toBe('ACTIVE');

    // Verify procurement exists directly in database table
    const dbProc = await prisma.procurement.findUnique({ where: { id: testProcurementId } });
    expect(dbProc).not.toBeNull();
    expect(dbProc?.status).toBe('BOOKED');
  });

  it('Step 5: Performs officer queue, weighment, and quality inspection in PostgreSQL', async () => {
    // 1. Advance to WEIGHING and record weighment
    await procurementRepository.updateProcurement(testProcurementId, {
      status: ProcurementStatus.WEIGHING,
      weighingAt: new Date().toISOString(),
    });

    const weighing = await procurementRepository.saveWeighing({
      procurementId: testProcurementId,
      grossWeight: 5200,
      tareWeight: 200,
      netWeight: 5000,
      scaleId: 'WB-TEST-01',
    });
    expect(weighing.netWeight).toBe(5000);

    // 2. Advance to QUALITY_CHECK and record inspection
    await procurementRepository.updateProcurement(testProcurementId, {
      status: ProcurementStatus.QUALITY_CHECK,
      qualityCheckAt: new Date().toISOString(),
    });

    const qc = await procurementRepository.saveQualityCheck({
      procurementId: testProcurementId,
      crop: 'WHEAT',
      moistureContent: 11.5,
      foreignMatter: 0.5,
      damagedGrains: 0.5,
      grade: 'A',
      accepted: true,
      remarks: 'Grade A Certified Wheat Lot',
    });
    expect(qc.grade).toBe('A');

    // 3. Pause centre queue to test queue pause persistence
    await centreRepository.setQueuePaused(testCentreId, true);
    const isPaused = await centreRepository.isQueuePaused(testCentreId);
    expect(isPaused).toBe(true);
  });

  it('Step 6: Creates and updates payment state with atomic DBT settlement in PostgreSQL', async () => {
    // Create payment in PENDING status
    const payment = await paymentRepository.createPayment({
      procurementId: testProcurementId,
      farmerId: testFarmerId,
      grossAmount: 113750,
      deductions: 2275,
      netAmount: 111475,
      status: PaymentStatus.PENDING,
    });
    expect(payment.status).toBe(PaymentStatus.PENDING);
    testPaymentId = payment.id;

    // Complete payment atomically via repository transaction
    const completed = await paymentRepository.completePaymentAtomic({
      paymentId: testPaymentId,
      utr: 'UTR998877665544',
      dbtReferenceId: 'DBT-PHASE23-PERSISTENCE',
      actorName: 'Nodal Officer Sharma',
    });

    expect(completed.payment.status).toBe(PaymentStatus.COMPLETED);
    expect(completed.payment.utr).toBe('UTR998877665544');

    // Verify linked procurement in database is COMPLETED
    const proc = await prisma.procurement.findUnique({ where: { id: testProcurementId } });
    expect(proc?.status).toBe('COMPLETED');
  });

  it('Step 7 & 8: Simulates server shutdown, wipes in-memory store, restarts backend, and re-initializes database', async () => {
    // Purposely wipe and reset the in-memory store to prove it is NOT the source of truth!
    store.farmers = [];
    store.users = [];
    store.tokens = [];
    store.procurements = [];
    store.weighings = [];
    store.qualityChecks = [];
    store.payments = [];
    store.slots = [];
    store.centres = [];

    // Re-run idempotent database initialization (simulates server restart boot sequence)
    await initializeDatabase();
  });

  it('Step 9: Verifies all created records still exist in PostgreSQL after restart', async () => {
    // 1. Farmer still exists
    const farmer = await farmerRepository.findById(testFarmerId);
    expect(farmer).not.toBeNull();
    expect(farmer?.name).toBe('Persistent Farmer Test');
    expect(farmer?.farmerId).toBe(uniqueFarmerId);

    // 2. Token still exists with status USED
    const token = await tokenRepository.findById(testTokenId);
    expect(token).not.toBeNull();
    expect(token?.status).toBe('USED');

    // 3. Procurement still exists with status COMPLETED
    const proc = await procurementRepository.findById(testProcurementId);
    expect(proc).not.toBeNull();
    expect(proc?.status).toBe(ProcurementStatus.COMPLETED);

    // 4. Weighing still exists
    const weighing = await procurementRepository.getWeighingByProcurementId(testProcurementId);
    expect(weighing).not.toBeNull();
    expect(weighing?.netWeight).toBe(5000);

    // 5. Quality check still exists
    const qc = await procurementRepository.getQualityCheckByProcurementId(testProcurementId);
    expect(qc).not.toBeNull();
    expect(qc?.grade).toBe('A');

    // 6. Payment still exists with UTR
    const payment = await paymentRepository.findById(testPaymentId);
    expect(payment).not.toBeNull();
    expect(payment?.status).toBe(PaymentStatus.COMPLETED);
    expect(payment?.utr).toBe('UTR998877665544');
    expect(payment?.dbtReferenceId).toBe('DBT-PHASE23-PERSISTENCE');

    // 7. Centre queue paused state still persisted in schema
    const isPaused = await centreRepository.isQueuePaused(testCentreId);
    expect(isPaused).toBe(true);
  });

  it('Step 10: Verifies farmer history still contains the persisted procurement and payment', async () => {
    const procHistory = await procurementService.getProcurementHistory(testFarmerId);
    expect(procHistory.some(p => p.id === testProcurementId)).toBe(true);

    const payHistory = await paymentService.getPaymentHistory(testFarmerId);
    expect(payHistory.some(p => p.id === testPaymentId)).toBe(true);
  });

  it('Step 11: Verifies the Officer dashboard and daily settlement reflect persisted data', async () => {
    const stats = await officerService.getOfficerStats(testCentreId);
    expect(stats).toBeDefined();
    expect(stats.completedLots).toBeGreaterThanOrEqual(1);
    expect(stats.paymentsCompleted).toBeGreaterThanOrEqual(1);
    expect(stats.isQueuePaused).toBe(true);

    const settlement = await officerService.getDailySettlement(testCentreId);
    expect(settlement.disbursedTotal).toBeGreaterThanOrEqual(111475);
    expect(settlement.transactions.some((t: any) => t.id === testPaymentId)).toBe(true);
  });

  it('Step 12: Verifies the Farmer profile and current status reflect persisted data', async () => {
    const farmerHistory = await officerService.getFarmerHistory(testFarmerId);
    expect(farmerHistory.totalProcurements).toBeGreaterThanOrEqual(1);
    expect(farmerHistory.totalPayments).toBeGreaterThanOrEqual(1);
    expect(farmerHistory.payments.some((p: any) => p.id === testPaymentId)).toBe(true);
  });
});
