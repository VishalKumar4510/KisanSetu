import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import store from '../../src/data/store';
import jwt from 'jsonwebtoken';

describe('Integration Tests: Authentication & Session Security', () => {
  beforeEach(() => {
    store.reset();
  });

  it('authenticates valid farmer credentials with bcrypt and returns sanitized response', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: 'farmer1', password: 'farmer1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();

    // Verify sanitized payload (zero password leakage)
    const user = res.body.data.user;
    expect(user.phone).toBe('farmer1');
    expect(user.role).toBe('FARMER');
    expect(user.password).toBeUndefined();

    // Verify JWT payload
    const decoded = jwt.decode(res.body.data.token) as { userId: string; role: string };
    expect(decoded.userId).toBe(user.id);
    expect(decoded.role).toBe('FARMER');
  });

  it('authenticates valid officer credentials using bcrypt', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: 'officer1', password: 'officer1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('OFFICER');
  });

  it('authenticates valid admin credentials using bcrypt', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: 'admin1', password: 'admin1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  it('rejects invalid password with 401 and generic error message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: 'farmer1', password: 'incorrectPassword123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('rejects nonexistent user phone without disclosing account nonexistence', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: 'nonexistent9999', password: 'farmer1' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('strictly rejects the hackathon phone === password bypass shortcut', async () => {
    // farmer-0011 has phone '9810000981' and password hash for 'Kisan@123'
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '9810000981', password: '9810000981' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('rejects empty or missing credentials with 400 validation error', async () => {
    const resEmpty = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(resEmpty.status).toBe(400);
    expect(resEmpty.body.error).toContain('Validation error');

    const resMissingPass = await request(app)
      .post('/api/auth/login')
      .send({ phone: 'farmer1' });

    expect(resMissingPass.status).toBe(400);
  });

  it('hashes password with bcrypt during registration and authenticates properly', async () => {
    const regPhone = `98765${Math.floor(10000 + Math.random() * 90000)}`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Harpreet Singh',
        phone: regPhone,
        password: 'SecurePass@123',
        role: 'FARMER',
        language: 'hi',
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.user.phone).toBe(regPhone);
    expect(regRes.body.data.user.password).toBeUndefined();

    // Verify stored user in store has bcrypt hash, not plaintext
    const storedUser = store.getUserByPhone(regPhone);
    expect(storedUser).toBeDefined();
    expect(storedUser?.password).toMatch(/^\$2b\$12\$/);

    // Verify login with correct password works
    const loginOk = await request(app)
      .post('/api/auth/login')
      .send({ phone: regPhone, password: 'SecurePass@123' });
    expect(loginOk.status).toBe(200);

    // Verify login with wrong password fails
    const loginFail = await request(app)
      .post('/api/auth/login')
      .send({ phone: regPhone, password: 'WrongPassword' });
    expect(loginFail.status).toBe(401);
  });

  it('rejects unauthenticated requests to protected endpoints with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Access token required');
  });

  it('rejects requests with forged or corrupted tokens with 403', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer forged.invalid.token');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Invalid or expired token');
  });

  it('returns current user profile on GET /api/auth/me with valid Bearer token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ phone: 'farmer1', password: 'farmer1' });
    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.phone).toBe('farmer1');
    expect(meRes.body.data.password).toBeUndefined();
  });
});
