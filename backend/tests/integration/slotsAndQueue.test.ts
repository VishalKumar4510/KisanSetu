import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import store from '../../src/data/store';
import { prisma } from '../../src/lib/prisma';
import { seedTokens, seedProcurements, seedSlots } from '../../src/data/seedData';

describe('Integration Tests: Slot Booking & Mandi Queue Management', () => {
  let farmer1Token: string;
  let farmer2Token: string;
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

    const f1 = await request(app).post('/api/auth/login').send({ phone: 'farmer1', password: 'farmer1' });
    farmer1Token = f1.body.data.token;

    const f2 = await request(app).post('/api/auth/login').send({ phone: 'farmer2', password: 'farmer2' });
    farmer2Token = f2.body.data.token;

    const off = await request(app).post('/api/auth/login').send({ phone: 'officer1', password: 'officer1' });
    officerToken = off.body.data.token;
  });

  it('successfully books an available slot and creates active token and procurement for farmer1', async () => {
    // farmer1 starts with NO active booking, ready to book
    const availableSlots = store.getAvailableSlots();
    const targetSlot = availableSlots[0];
    expect(targetSlot).toBeDefined();

    const initialBookings = targetSlot.currentBookings;

    const res = await request(app)
      .post('/api/slots/book')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({
        centreId: targetSlot.centreId,
        slotId: targetSlot.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.token.status).toBe('ACTIVE');
    expect(res.body.data.token.tokenNumber).toMatch(/^T-\d{4}-\d{4}$/);
    expect(res.body.data.procurement).toBeDefined();
    expect(res.body.data.procurement.status).toBe('BOOKED');

    // Verify slot capacity incremented in store
    const updatedSlot = store.getSlotById(targetSlot.id);
    expect(updatedSlot?.currentBookings).toBe(initialBookings + 1);
  });

  it('rejects slot booking with invalid payload (empty slotId) with 400 Validation Error', async () => {
    const res = await request(app)
      .post('/api/slots/book')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({ slotId: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Validation error');
  });

  it('rejects duplicate booking when farmer already has an active token (409 Conflict)', async () => {
    // farmer2 (farmer-0002) starts with an active token in seed data
    const activeToken = store.getActiveTokenByFarmer('farmer-0002');
    expect(activeToken).toBeDefined();

    const availableSlots = store.getAvailableSlots();
    const targetSlot = availableSlots[0];

    const res = await request(app)
      .post('/api/slots/book')
      .set('Authorization', `Bearer ${farmer2Token}`)
      .send({
        centreId: targetSlot.centreId,
        slotId: targetSlot.id,
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('You already have an active booking');
  });

  it('rejects booking when slot capacity is exhausted (409 Conflict)', async () => {
    // Set a slot capacity to full
    const slot = store.getAvailableSlots()[0];
    store.updateSlot(slot.id, { currentBookings: slot.maxCapacity, status: 'FULL' });

    const res = await request(app)
      .post('/api/slots/book')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({
        centreId: slot.centreId,
        slotId: slot.id,
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Slot is full');
  });

  it('returns valid queue position and ETA for farmer with active token', async () => {
    // farmer2 has an active token in seed data
    const res = await request(app)
      .get('/api/queue/position')
      .set('Authorization', `Bearer ${farmer2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.position).toBeGreaterThanOrEqual(1);
    expect(res.body.data.totalInQueue).toBeGreaterThanOrEqual(1);
    expect(res.body.data.estimatedTime).toBeDefined();
  });

  it('strictly rejects unauthorized queue position queries targeting another farmer (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/queue/position?farmerId=farmer-0002')
      .set('Authorization', `Bearer ${farmer1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('enforces cancellation ownership (farmer can cancel own token, not another farmer token)', async () => {
    // 1. Farmer 1 books a slot to obtain an active token
    const slot = store.getAvailableSlots()[0];
    const bookRes = await request(app)
      .post('/api/slots/book')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({ slotId: slot.id });
    const farmer1TokenId = bookRes.body.data.token.id;

    // Farmer 2 has active token token-0001
    const farmer2Token = store.getActiveTokenByFarmer('farmer-0002')!;
    expect(farmer2Token).toBeDefined();

    // 2. Farmer 1 attempts to cancel Farmer 2's token -> 403 Forbidden
    const unauthorizedCancelRes = await request(app)
      .post('/api/slots/cancel')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({ tokenId: farmer2Token.id });

    expect(unauthorizedCancelRes.status).toBe(403);
    expect(unauthorizedCancelRes.body.error).toContain('Unauthorized');

    // 3. Farmer 1 cancels own token -> 200 OK
    const ownCancelRes = await request(app)
      .post('/api/slots/cancel')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({ tokenId: farmer1TokenId });

    expect(ownCancelRes.status).toBe(200);
    expect(ownCancelRes.body.message).toBe('Booking cancelled');

    // Verify token status updated in store
    const cancelledToken = store.getTokenById(farmer1TokenId);
    expect(cancelledToken?.status).toBe('CANCELLED');
  });

  it('simulates concurrent booking race condition risks in current in-memory store', async () => {
    // In an in-memory single-threaded Node event loop, synchronous blocks prevent data corruption.
    // However, when scaled across multiple Node processes or asynchronous I/O, database-level
    // atomic transactions (Prisma $transaction with row-level locks) will be required in Phase 18.
    const slot = store.getAvailableSlots()[1];
    expect(slot).toBeDefined();

    // Both farmers attempt booking concurrently
    const [token1, token2] = await Promise.all([
      request(app).post('/api/slots/book').set('Authorization', `Bearer ${farmer1Token}`).send({ slotId: slot.id }),
      request(app).post('/api/slots/book').set('Authorization', `Bearer ${farmer2Token}`).send({ slotId: slot.id }),
    ]);

    // Both should receive controlled responses (either success or 409 duplicate)
    expect([201, 409]).toContain(token1.status);
    expect([201, 409]).toContain(token2.status);
  });
});
