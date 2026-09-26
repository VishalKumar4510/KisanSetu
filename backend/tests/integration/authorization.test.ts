import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import store from '../../src/data/store';

describe('Integration Tests: Role Authorization & BOLA/IDOR Defense', () => {
  let farmer1Token: string;
  let farmer2Token: string;
  let officerToken: string;
  let adminToken: string;

  beforeEach(async () => {
    store.reset();

    const f1 = await request(app).post('/api/auth/login').send({ phone: 'farmer1', password: 'farmer1' });
    farmer1Token = f1.body.data.token;

    const f2 = await request(app).post('/api/auth/login').send({ phone: 'farmer2', password: 'farmer2' });
    farmer2Token = f2.body.data.token;

    const off = await request(app).post('/api/auth/login').send({ phone: 'officer1', password: 'officer1' });
    officerToken = off.body.data.token;

    const adm = await request(app).post('/api/auth/login').send({ phone: 'admin1', password: 'admin1' });
    adminToken = adm.body.data.token;
  });

  // Case 1: Farmer accesses own profile -> 200
  it('allows farmer to access own profile on /api/farmers/me', async () => {
    const res = await request(app)
      .get('/api/farmers/me')
      .set('Authorization', `Bearer ${farmer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('farmer-0001');
  });

  // Case 2: Farmer accesses another farmer profile -> 403
  it('denies farmer from accessing another farmer profile on /api/farmers/:id (IDOR defense)', async () => {
    const res = await request(app)
      .get('/api/farmers/farmer-0002')
      .set('Authorization', `Bearer ${farmer1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Forbidden');
  });

  // Case 3: Farmer accesses own payment -> 200
  it('allows farmer to access own current payment and payment history', async () => {
    const currentRes = await request(app)
      .get('/api/payments/current')
      .set('Authorization', `Bearer ${farmer1Token}`);
    expect(currentRes.status).toBe(200);

    const historyRes = await request(app)
      .get('/api/payments/history')
      .set('Authorization', `Bearer ${farmer1Token}`);
    expect(historyRes.status).toBe(200);
    expect(Array.isArray(historyRes.body.data)).toBe(true);
  });

  // Case 4: Farmer tries another farmer payment -> 403
  it('denies farmer from accessing another farmer payment via query override (BOLA defense)', async () => {
    const currentRes = await request(app)
      .get('/api/payments/current?farmerId=farmer-0002')
      .set('Authorization', `Bearer ${farmer1Token}`);

    expect(currentRes.status).toBe(403);
    expect(currentRes.body.error).toContain('Forbidden');

    const historyRes = await request(app)
      .get('/api/payments/history?farmerId=farmer-0002')
      .set('Authorization', `Bearer ${farmer1Token}`);

    expect(historyRes.status).toBe(403);
    expect(historyRes.body.error).toContain('Forbidden');
  });

  // Case 5: Farmer accesses own procurement -> 200
  it('allows farmer to access own active procurement', async () => {
    const res = await request(app)
      .get('/api/procurement/current')
      .set('Authorization', `Bearer ${farmer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // Case 6: Farmer tries another farmer procurement -> 403
  it('denies farmer from accessing another farmer procurement (BOLA/IDOR defense)', async () => {
    const res = await request(app)
      .get('/api/procurement/current?farmerId=farmer-0002')
      .set('Authorization', `Bearer ${farmer1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');

    // Also verify by direct procurement id access
    const allProcurements = store.getAllProcurements();
    const otherFarmerProc = allProcurements.find(p => p.farmerId === 'farmer-0002');
    if (otherFarmerProc) {
      const directRes = await request(app)
        .get(`/api/procurement/${otherFarmerProc.id}`)
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(directRes.status).toBe(403);
    }
  });

  // Case 7: Farmer accesses officer API -> 403
  it('strictly blocks farmer role from calling officer desk endpoints', async () => {
    const statsRes = await request(app)
      .get('/api/officer/stats')
      .set('Authorization', `Bearer ${farmer1Token}`);
    expect(statsRes.status).toBe(403);

    const callRes = await request(app)
      .post('/api/officer/call')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({ centreId: 'centre-1' });
    expect(callRes.status).toBe(403);

    const weighRes = await request(app)
      .post('/api/officer/weighment')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({ procurementId: 'proc-001', grossWeight: 50, tareWeight: 10 });
    expect(weighRes.status).toBe(403);
  });

  // Case 8: Farmer accesses admin API -> 403
  it('strictly blocks farmer role from administrative management endpoints', async () => {
    const listFarmersRes = await request(app)
      .get('/api/farmers')
      .set('Authorization', `Bearer ${farmer1Token}`);
    expect(listFarmersRes.status).toBe(403);

    const processPaymentRes = await request(app)
      .put('/api/payments/pay-001/process')
      .set('Authorization', `Bearer ${farmer1Token}`);
    expect(processPaymentRes.status).toBe(403);
  });

  // Case 9: Authorized officer endpoint -> 200
  it('permits authenticated officer to access officer operations endpoints', async () => {
    const statsRes = await request(app)
      .get('/api/officer/stats')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.data.farmersServedToday).toBeDefined();

    const queueRes = await request(app)
      .get('/api/officer/queue')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(queueRes.status).toBe(200);

    const farmersListRes = await request(app)
      .get('/api/farmers')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(farmersListRes.status).toBe(200);
    expect(Array.isArray(farmersListRes.body.data)).toBe(true);
  });

  // Case 10: Invalid or expired token -> 401/403
  it('rejects missing token with 401 and malformed token with 403', async () => {
    const noTokenRes = await request(app).get('/api/officer/stats');
    expect(noTokenRes.status).toBe(401);

    const badTokenRes = await request(app)
      .get('/api/officer/stats')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.badpayload.signature');
    expect(badTokenRes.status).toBe(403);
  });
});
