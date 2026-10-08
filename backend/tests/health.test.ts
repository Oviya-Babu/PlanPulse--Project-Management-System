import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/lib/prisma';

describe('Health and Infrastructure APIs', () => {
  const app = createApp();

  it('GET /api/unknown-endpoint returns 404 with standard error envelope', async () => {
    const res = await request(app).get('/api/unknown-endpoint');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(res.body.error).toHaveProperty('message');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /api/health returns 200 when database is connected', async () => {
    // Mock prisma.$queryRaw to simulate connected DB in unit/mocked test
    vi.spyOn(prisma, '$queryRaw').mockResolvedValueOnce([{ '?column?': 1 }]);

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.body.timestamp).toBeDefined();
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /api/health returns 503 when database is disconnected', async () => {
    vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('Connection timeout'));

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.database).toBe('disconnected');
    expect(res.body.error).toBe('Database connection failed');
  });
});
