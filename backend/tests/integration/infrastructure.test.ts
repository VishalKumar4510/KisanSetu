import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';

describe('Phase 20 Infrastructure & Observability Tests', () => {
  // 1. Health Liveness Probe
  it('GET /health/live returns 200 OK without requiring authentication', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  // 2. Health Readiness Probe
  it('GET /health/ready verifies database connectivity and returns 200 ready', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ready' });
  });

  // 3. Request Correlation ID
  it('attaches and returns generated x-request-id header on every response', async () => {
    const res = await request(app).get('/health/live');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-request-id']).toMatch(/^[a-zA-Z0-9_-]{8,64}$/);
  });

  it('preserves incoming client-supplied x-request-id for end-to-end tracing', async () => {
    const customId = 'client-trace-1234567890-test';
    const res = await request(app).get('/health/live').set('x-request-id', customId);
    expect(res.headers['x-request-id']).toBe(customId);
  });

  // 4. HTTP Security Headers
  it('sets secure HTTP headers on responses via Helmet', async () => {
    const res = await request(app).get('/health/live');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  // 5. Error Sanitization
  it('sanitizes 404 Not Found without disclosing internal server paths or framework details', async () => {
    const res = await request(app).get('/api/unknown-nonexistent-endpoint');
    expect(res.status).toBe(404);
    // Should not include internal stack trace or raw SQL in body
    expect(res.text).not.toContain('C:\\Users');
    expect(res.text).not.toContain('prisma');
  });

  // 6. Demo Mode State
  it('handles demo endpoints according to DEMO_MODE configuration', async () => {
    const res = await request(app).get('/api/demo/state');
    // In test environment, DEMO_MODE defaults to true
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentStep).toBeDefined();
  });
});
