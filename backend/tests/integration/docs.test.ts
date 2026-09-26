import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';

describe('Integration Tests: OpenAPI 3.0 & Swagger UI Documentation', () => {
  it('serves interactive Swagger UI HTML on GET /api/docs/', async () => {
    const res = await request(app).get('/api/docs/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('swagger-ui');
    expect(res.text).toContain('KisanSetu API Documentation');
  });

  it('serves OpenAPI 3.0 specification JSON on GET /api/docs/json', async () => {
    const res = await request(app).get('/api/docs/json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toContain('KisanSetu API');
    expect(res.body.paths).toBeDefined();
    expect(res.body.paths['/api/auth/login']).toBeDefined();
    expect(res.body.paths['/api/slots/book']).toBeDefined();
    expect(res.body.paths['/api/officer/weighment']).toBeDefined();
    expect(res.body.paths['/api/payments']).toBeDefined();
    expect(res.body.components.securitySchemes.BearerAuth).toBeDefined();
  });

  it('serves OpenAPI 3.0 specification on GET /api/docs/spec.json', async () => {
    const res = await request(app).get('/api/docs/spec.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
  });
});
