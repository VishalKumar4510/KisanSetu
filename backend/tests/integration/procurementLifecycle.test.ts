import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import store from '../../src/data/store';
import { prisma } from '../../src/lib/prisma';
import { seedTokens, seedProcurements, seedSlots } from '../../src/data/seedData';
import { ProcurementStatus } from '../../../shared/types';

describe('Integration Tests: Procurement State Machine Lifecycle', () => {
  let farmerToken: string;
  let officerToken: string;

  beforeEach(async () => {
    store.reset();
    await prisma.procurement.deleteMany({
      where: { id: { notIn: seedProcurements.map(p => p.id) } },
    }).catch(() => {});
    await prisma.token.deleteMany({
      where: { id: { notIn: seedTokens.map(t => t.id) } },
    }).catch(() => {});
    for (const s of seedSlots) {
      await prisma.slot.update({
        where: { id: s.id },
        data: { currentBookings: s.currentBookings, status: s.status as any },
      }).catch(() => {});
    }

    const f = await request(app).post('/api/auth/login').send({ phone: 'farmer1', password: 'farmer1' });
    farmerToken = f.body.data.token;

    const off = await request(app).post('/api/auth/login').send({ phone: 'officer1', password: 'officer1' });
    officerToken = off.body.data.token;
  });

  it('progresses through the realistic procurement lifecycle step-by-step', async () => {
    // 1. Farmer books a slot -> procurement status: BOOKED
    const slot = store.getAvailableSlots()[0];
    const bookRes = await request(app)
      .post('/api/slots/book')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ slotId: slot.id });

    expect(bookRes.status).toBe(201);
    const procId = bookRes.body.data.procurement.id;
    const tokenId = bookRes.body.data.token.id;
    expect(bookRes.body.data.procurement.status).toBe(ProcurementStatus.BOOKED);

    // 2. Officer calls farmer -> procurement status: CALLED
    const callRes = await request(app)
      .post('/api/officer/call')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ centreId: slot.centreId, tokenId });

    expect(callRes.status).toBe(200);
    const procAfterCall = store.getProcurementById(procId);
    expect([ProcurementStatus.CALLED, ProcurementStatus.ARRIVED]).toContain(procAfterCall?.status);

    // 3. Officer records weighment -> procurement status: QUALITY_CHECK
    const weighRes = await request(app)
      .post('/api/officer/weighment')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        procurementId: procId,
        grossWeight: 65.5,
        tareWeight: 15.5,
        scaleId: 'scale-wb-01',
      });

    expect(weighRes.status).toBe(200);
    expect(weighRes.body.data.weighing.netWeight).toBe(50.0);
    const procAfterWeigh = store.getProcurementById(procId);
    expect(procAfterWeigh?.status).toBe(ProcurementStatus.QUALITY_CHECK);

    // 4. Officer performs quality assessment -> procurement status: PROCUREMENT
    const qualityRes = await request(app)
      .post('/api/officer/quality')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        procurementId: procId,
        crop: 'WHEAT',
        moistureContent: 11.5,
        foreignMatter: 0.4,
        damagedGrains: 1.0,
        grade: 'A',
        qualityResult: 'ACCEPTED',
        remarks: 'Optimal moisture and high grain luster.',
      });

    expect(qualityRes.status).toBe(200);
    const procAfterQuality = store.getProcurementById(procId);
    expect(procAfterQuality?.status).toBe(ProcurementStatus.PROCUREMENT);

    // 5. Officer calculates MSP & payment -> procurement status: PAYMENT_PENDING
    const calcRes = await request(app)
      .post('/api/officer/calculate')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ procurementId: procId });

    expect(calcRes.status).toBe(200);
    expect(calcRes.body.data.finalPayableAmount).toBeGreaterThan(0);
    const procAfterCalc = store.getProcurementById(procId);
    expect(procAfterCalc?.status).toBe(ProcurementStatus.PAYMENT_PENDING);

    // 6. Officer reviews payment and initiates simulated transfer -> PAYMENT_PROCESSING
    const payInitRes = await request(app)
      .post('/api/officer/payment/initiate')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ procurementId: procId });

    expect(payInitRes.status).toBe(200);
    const procAfterInit = store.getProcurementById(procId);
    expect(procAfterInit?.status).toBe(ProcurementStatus.PAYMENT_PROCESSING);

    // 7. Officer completes payment processing -> COMPLETED
    const payment = store.getPaymentByProcurement(procId)!;
    expect(payment).toBeDefined();

    const payProcRes = await request(app)
      .post('/api/officer/payment/process')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ paymentId: payment.id, simulateFailure: false });

    expect(payProcRes.status).toBe(200);
    const finalProc = store.getProcurementById(procId);
    expect(finalProc?.status).toBe(ProcurementStatus.COMPLETED);
  });

  it('rejects skipping states in direct status transition (e.g. BOOKED -> WEIGHING)', async () => {
    // Find an active procurement in BOOKED status
    const allProcs = store.getAllProcurements();
    const bookedProc = allProcs.find(p => p.status === ProcurementStatus.BOOKED);
    expect(bookedProc).toBeDefined();

    const res = await request(app)
      .put(`/api/procurement/${bookedProc!.id}/status`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ status: ProcurementStatus.WEIGHING });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid transition');
  });

  it('rejects backwards transition (e.g. COMPLETED -> BOOKED)', async () => {
    const allProcs = store.getAllProcurements();
    const completedProc = allProcs.find(p => p.status === ProcurementStatus.COMPLETED);
    expect(completedProc).toBeDefined();

    const res = await request(app)
      .put(`/api/procurement/${completedProc!.id}/status`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ status: ProcurementStatus.BOOKED });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid transition');
  });

  it('rejects invalid or fabricated status strings with 400 Validation Error', async () => {
    const anyProc = store.getAllProcurements()[0];

    const res = await request(app)
      .put(`/api/procurement/${anyProc.id}/status`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ status: 'SUPER_INVALID_STATUS' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Validation error');
  });

  it('strictly blocks farmer role from modifying procurement status (403 Forbidden)', async () => {
    const anyProc = store.getAllProcurements()[0];

    const res = await request(app)
      .put(`/api/procurement/${anyProc.id}/status`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ status: ProcurementStatus.ARRIVED });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Insufficient permissions');
  });
});
