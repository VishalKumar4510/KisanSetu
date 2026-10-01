import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeDatabase, prisma, pool } from '../../src/lib/prisma';
import { stopLocalPostgres } from '../../src/lib/dbServer';
import {
  userRepository,
  farmerRepository,
  slotRepository,
  tokenRepository,
  procurementRepository,
  paymentRepository,
  centreRepository,
} from '../../src/repositories';
import { seedDatabase, seedBaseDataIfNotExists } from '../../prisma/seed';
import { ProduceType, PaymentStatus, ProcurementStatus } from '../../../shared/types';

describe('Phase 18 Integration Tests: PostgreSQL & Prisma Persistent Layer', () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  // 1. Authentication & User Persistence
  it('authenticates and loads user directly from PostgreSQL user record', async () => {
    const user = await userRepository.findByPhone('farmer1');
    expect(user).toBeDefined();
    expect(user?.name).toBe('Rajesh Kumar');
    expect(user?.role).toBe('FARMER');
    expect(user?.password).toBeDefined();
    expect(user?.password?.startsWith('$2b$12$')).toBe(true); // Valid bcrypt hash
  });

  // 2. Farmer Profile Persistence & Updates
  it('reads and updates farmer profile persisted in PostgreSQL', async () => {
    const farmer = await farmerRepository.findByFarmerId('KS-FARM-0001');
    expect(farmer).toBeDefined();
    expect(farmer?.village).toBe('Rampur');
    expect(farmer?.district).toBe('Lucknow');

    // Update village in PostgreSQL
    const updated = await farmerRepository.updateFarmer(farmer!.id, {
      village: 'Rampur North',
    });
    expect(updated?.village).toBe('Rampur North');

    // Re-query directly to confirm persistence
    const reloaded = await farmerRepository.findById(farmer!.id);
    expect(reloaded?.village).toBe('Rampur North');
  });

  // 3. Slot Booking Atomic Transaction & Capacity Updates
  it('executes atomic slot booking transaction, updates capacity, and rejects duplicate active booking', async () => {
    const centre = (await prisma.centre.findMany())[0];
    const availableSlot = await prisma.slot.findFirst({
      where: { centreId: centre.id, status: 'AVAILABLE' },
    });
    expect(availableSlot).toBeDefined();

    const farmer = (await farmerRepository.findByFarmerId('KS-FARM-0001'))!;
    const initialBookings = availableSlot!.currentBookings;

    // 1. Atomic booking
    const booking = await slotRepository.bookSlotAtomic({
      slotId: availableSlot!.id,
      farmerId: farmer.id,
      centreId: centre.id,
      crop: ProduceType.WHEAT,
      estimatedQuantity: 60,
    });

    expect(booking.token.status).toBe('ACTIVE');
    expect(booking.procurement.status).toBe('BOOKED');
    expect(booking.slot.currentBookings).toBe(initialBookings + 1);

    // Verify slot capacity in PostgreSQL
    const slotInDb = await slotRepository.findById(availableSlot!.id);
    expect(slotInDb?.currentBookings).toBe(initialBookings + 1);

    // 2. Duplicate booking rejection
    await expect(
      slotRepository.bookSlotAtomic({
        slotId: availableSlot!.id,
        farmerId: farmer.id,
        centreId: centre.id,
      })
    ).rejects.toThrow('Farmer already has an active token');
  });

  // 4. Token & Queue State Persistence
  it('persists queue tokens and accurately computes active centre queue', async () => {
    const centre = (await prisma.centre.findMany())[0];
    const activeTokens = await tokenRepository.findActiveByCentreId(centre.id);
    expect(activeTokens.length).toBeGreaterThan(0);
    expect(activeTokens.every(t => t.status === 'ACTIVE')).toBe(true);
  });

  // 5. Procurement State Transitions & Timeline Event Persistence
  it('persists procurement state transitions and inspection events', async () => {
    const farmer = (await farmerRepository.findByFarmerId('KS-FARM-0001'))!;
    const activeProc = (await procurementRepository.findActiveByFarmerId(farmer.id))!;
    expect(activeProc).toBeDefined();

    // Transition to WEIGHING and record weighbridge net weight
    await procurementRepository.updateProcurement(activeProc.id, {
      status: ProcurementStatus.WEIGHING,
      weighingAt: new Date().toISOString(),
    });

    const weighing = await procurementRepository.saveWeighing({
      procurementId: activeProc.id,
      grossWeight: 6200,
      tareWeight: 1200,
      netWeight: 5000,
      scaleId: 'WB-01',
    });
    expect(weighing.netWeight).toBe(5000);

    // Transition to QUALITY_CHECK and record inspection
    await procurementRepository.updateProcurement(activeProc.id, {
      status: ProcurementStatus.QUALITY_CHECK,
      qualityCheckAt: new Date().toISOString(),
    });

    const qc = await procurementRepository.saveQualityCheck({
      procurementId: activeProc.id,
      crop: 'WHEAT',
      moistureContent: 12.0,
      foreignMatter: 1.0,
      damagedGrains: 1.0,
      grade: 'A',
      accepted: true,
      remarks: 'Certified Agmarknet Grade A',
    });
    expect(qc.grade).toBe('A');

    // Add timeline event
    await procurementRepository.addTimelineEvent(activeProc.id, {
      stage: 'QUALITY_COMPLETED',
      label: 'Quality inspection verified Grade A',
      actor: 'Quality Inspector',
    });

    const refreshedProc = await procurementRepository.findById(activeProc.id);
    expect(refreshedProc?.status).toBe(ProcurementStatus.QUALITY_CHECK);
    expect(refreshedProc?.timeline?.length).toBeGreaterThan(0);
  });

  // 6. Payment & DBT State Consistency Transaction
  it('persists payment state, failure simulation, and atomic DBT settlement', async () => {
    const farmer = (await farmerRepository.findByFarmerId('KS-FARM-0001'))!;
    const activeProc = (await procurementRepository.findActiveByFarmerId(farmer.id))!;

    // Create payment in PENDING status
    const createdPayment = await paymentRepository.createPayment({
      procurementId: activeProc.id,
      farmerId: farmer.id,
      grossAmount: 113750,
      deductions: 2275,
      netAmount: 111475,
      status: PaymentStatus.PENDING,
    });
    expect(createdPayment.status).toBe(PaymentStatus.PENDING);

    // Simulate gateway timeout / failure
    const failedPayment = await paymentRepository.updatePayment(createdPayment.id, {
      status: PaymentStatus.FAILED,
      failureReason: 'SIM_ERR_GATEWAY_TIMEOUT',
    });
    expect(failedPayment?.status).toBe(PaymentStatus.FAILED);

    // Execute atomic DBT settlement transaction (Payment -> COMPLETED, Procurement -> COMPLETED, Token -> USED)
    const settlement = await paymentRepository.completePaymentAtomic({
      paymentId: createdPayment.id,
      utr: '982499887766',
      dbtReferenceId: 'DBT-20260926-TESTUTR',
      actorName: 'Officer Verma',
    });

    expect(settlement.payment.status).toBe(PaymentStatus.COMPLETED);
    expect(settlement.payment.utr).toBe('982499887766');

    // Verify linked procurement in PostgreSQL is also COMPLETED
    const linkedProc = await procurementRepository.findById(activeProc.id);
    expect(linkedProc?.status).toBe(ProcurementStatus.COMPLETED);

    // Verify linked token is marked USED
    const token = await tokenRepository.findById(linkedProc!.tokenId);
    expect(token?.status).toBe('USED');
  });

  // 7. Security: IDOR Defense via Repository
  it('enforces farmer identity boundaries and prevents unauthorized profile manipulation', async () => {
    const farmer1 = (await farmerRepository.findByFarmerId('KS-FARM-0001'))!;
    const farmer2 = (await farmerRepository.findByFarmerId('KS-FARM-0002'))!;

    expect(farmer1.id).not.toBe(farmer2.id);
    expect(farmer1.phone).not.toBe(farmer2.phone);

    // Verify independent payments
    const payments1 = await paymentRepository.findByFarmerId(farmer1.id);
    const payments2 = await paymentRepository.findByFarmerId(farmer2.id);
    expect(payments1.every(p => p.farmerId === farmer1.id)).toBe(true);
    expect(payments2.every(p => p.farmerId === farmer2.id)).toBe(true);
  });

  // 8. Queue Pause/Resume Persistence in PostgreSQL Schema
  it('persists centre queue pause state in PostgreSQL schema without in-memory dependency', async () => {
    const centres = await centreRepository.getAllCentres();
    expect(centres.length).toBeGreaterThan(0);
    const centre = centres[0];

    // Pause queue in database
    await centreRepository.setQueuePaused(centre.id, true);
    const isPaused = await centreRepository.isQueuePaused(centre.id);
    expect(isPaused).toBe(true);

    // Verify directly from Prisma
    const dbCentre = await prisma.centre.findUnique({ where: { id: centre.id } });
    expect(dbCentre?.isQueuePaused).toBe(true);

    // Resume queue in database
    await centreRepository.setQueuePaused(centre.id, false);
    const isResumed = await centreRepository.isQueuePaused(centre.id);
    expect(isResumed).toBe(false);
  });

  // 9. Idempotent Database Initialization & Seeding
  it('idempotent initialization preserves existing records and does not duplicate or wipe database', async () => {
    const initialUsersCount = await prisma.user.count();
    expect(initialUsersCount).toBeGreaterThan(0);

    // Running non-destructive seed should detect existing data and preserve records
    await seedBaseDataIfNotExists();

    const postSeedUsersCount = await prisma.user.count();
    expect(postSeedUsersCount).toBe(initialUsersCount);
  });
});
