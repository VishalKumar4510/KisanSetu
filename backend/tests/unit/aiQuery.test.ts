import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import { MSP_RATES, ProduceType } from '../../../shared/types';

describe('Unit Tests: AI Query Intent Processing (/api/ai/query)', () => {
  it('rejects missing query with 400 Bad Request', async () => {
    const res = await request(app).post('/api/ai/query').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Query required');
  });

  it('answers MSP rate query with accurate rates in English and Hindi', async () => {
    const res = await request(app).post('/api/ai/query').send({ query: "What is today's MSP?" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toContain('Wheat: ₹2275');
    expect(res.body.data.answerHi).toContain('गेहूं: ₹2275');
    expect(res.body.data.data.mspRates[ProduceType.WHEAT]).toBe(MSP_RATES[ProduceType.WHEAT]);
  });

  it('answers MSP rate query in Hindi (एमएसपी दर क्या है)', async () => {
    const res = await request(app).post('/api/ai/query').send({ query: 'गेहूं की एमएसपी क्या है?' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answerHi).toContain('न्यूनतम समर्थन मूल्य');
  });

  it('answers longest queue queries in English and Hindi', async () => {
    const res = await request(app).post('/api/ai/query').send({ query: 'Which mandi has the longest queue?' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toContain('longest queue');
    expect(res.body.data.answerHi).toContain('सबसे लंबी कतार');
  });

  it('answers earliest slot queries in English and Hindi', async () => {
    const res = await request(app).post('/api/ai/query').send({ query: 'Which slot is available earliest?' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toMatch(/Earliest available slot|No slots are currently available/);
  });

  it('answers total waiting farmers query', async () => {
    const res = await request(app).post('/api/ai/query').send({ query: 'How many farmers are waiting in queue?' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toContain('farmers are waiting in queue');
    expect(res.body.data.answerHi).toContain('किसान कतार में प्रतीक्षा कर रहे हैं');
    expect(res.body.data.data.totalWaiting).toBeDefined();
  });

  it('answers lowest waiting time query', async () => {
    const res = await request(app).post('/api/ai/query').send({ query: 'Where is the lowest waiting time?' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toContain('lowest waiting time');
    expect(res.body.data.data.waitTime).toBeDefined();
  });

  it('handles token status when farmerId is passed', async () => {
    const res = await request(app).post('/api/ai/query').send({ query: 'What is my token status?', farmerId: 'farmer-001' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer.length).toBeGreaterThan(0);
  });

  it('handles token status when unauthenticated and no farmerId provided', async () => {
    const res = await request(app).post('/api/ai/query').send({ query: 'What is my token status?' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toContain('Please log in as a farmer');
  });

  it('handles payment status when unauthenticated and no farmerId provided', async () => {
    const res = await request(app).post('/api/ai/query').send({ query: 'Where is my payment?' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toContain('Please log in as a farmer');
  });

  it('returns general platform summary fallback for unrecognized queries', async () => {
    const res = await request(app).post('/api/ai/query').send({ query: 'Hello there, tell me something about the weather.' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toContain('KisanSetu Summary:');
    expect(res.body.data.answerHi).toContain('किसानसेतु सारांश:');
    expect(res.body.data.data.farmers).toBeDefined();
  });
});
