import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

const app = createApp();

describe('Security Hardening Suite (Slice 6 / AC-SEC-01..12)', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let proj1Id: string;
  let task1Id: string;

  beforeAll(async () => {
    // Register User 1
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Security User One',
        email: `sec1_${Date.now()}@example.com`,
        password: 'Password123!',
      });
    user1Token = res1.body.token;
    user1Id = res1.body.user.id;

    // Register User 2
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Security User Two',
        email: `sec2_${Date.now()}@example.com`,
        password: 'Password123!',
      });
    user2Token = res2.body.token;
    user2Id = res2.body.user.id;

    // Create a project and task owned by User 1
    const p1 = await prisma.project.create({
      data: {
        ownerId: user1Id,
        name: 'Secured Project 1',
        status: 'IN_PROGRESS',
      },
    });
    proj1Id = p1.id;

    const t1 = await prisma.task.create({
      data: {
        projectId: proj1Id,
        name: 'Secured Task 1',
        status: 'PENDING',
      },
    });
    task1Id = t1.id;
  });

  afterAll(async () => {
    await prisma.task.deleteMany({ where: { project: { ownerId: { in: [user1Id, user2Id] } } } });
    await prisma.project.deleteMany({ where: { ownerId: { in: [user1Id, user2Id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [user1Id, user2Id] } } });
  });

  // AC-SEC-01: Passwords hashed with bcrypt cost 12
  it('stores passwords only as bcrypt hashes, never plaintext (AC-SEC-01)', async () => {
    const userInDb = await prisma.user.findUnique({ where: { id: user1Id } });
    expect(userInDb).toBeDefined();
    expect(userInDb!.passwordHash).not.toBe('Password123!');
    expect(userInDb!.passwordHash.startsWith('$2')).toBe(true);
    const matches = await bcrypt.compare('Password123!', userInDb!.passwordHash);
    expect(matches).toBe(true);
  });

  // AC-SEC-02: Route enumeration - all non-public routes return 401 without token
  it('rejects unauthenticated requests on all protected routes (AC-SEC-02)', async () => {
    const protectedRoutes = [
      { method: 'get', url: '/api/auth/me' },
      { method: 'get', url: '/api/projects' },
      { method: 'post', url: '/api/projects' },
      { method: 'get', url: `/api/projects/${proj1Id}` },
      { method: 'put', url: `/api/projects/${proj1Id}` },
      { method: 'delete', url: `/api/projects/${proj1Id}` },
      { method: 'get', url: '/api/tasks' },
      { method: 'post', url: '/api/tasks' },
      { method: 'get', url: `/api/tasks/${task1Id}` },
      { method: 'put', url: `/api/tasks/${task1Id}` },
      { method: 'delete', url: `/api/tasks/${task1Id}` },
      { method: 'get', url: '/api/dashboard' },
    ];

    for (const route of protectedRoutes) {
      let reqSender;
      if (route.method === 'get') reqSender = request(app).get(route.url);
      else if (route.method === 'post') reqSender = request(app).post(route.url).send({});
      else if (route.method === 'put') reqSender = request(app).put(route.url).send({});
      else reqSender = request(app).delete(route.url);

      const res = await reqSender;
      expect(res.status, `Failed for ${route.method.toUpperCase()} ${route.url}`).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    }
  });

  // AC-SEC-03: Two-user authorization matrix (BOLA/IDOR protection)
  it('strictly returns 404 with zero side effects when accessing foreign resources (AC-SEC-03)', async () => {
    // User 2 attempts to GET User 1 project -> 404
    const getProj = await request(app)
      .get(`/api/projects/${proj1Id}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(getProj.status).toBe(404);
    expect(getProj.body.error.code).toBe('PROJECT_NOT_FOUND');

    // User 2 attempts to UPDATE User 1 project -> 404
    const putProj = await request(app)
      .put(`/api/projects/${proj1Id}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ name: 'Hacked Project' });
    expect(putProj.status).toBe(404);

    // User 2 attempts to DELETE User 1 project -> 404
    const delProj = await request(app)
      .delete(`/api/projects/${proj1Id}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(delProj.status).toBe(404);

    // User 2 attempts to GET User 1 task -> 404
    const getTask = await request(app)
      .get(`/api/tasks/${task1Id}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(getTask.status).toBe(404);
    expect(getTask.body.error.code).toBe('TASK_NOT_FOUND');

    // User 2 attempts to UPDATE User 1 task -> 404
    const putTask = await request(app)
      .put(`/api/tasks/${task1Id}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ status: 'COMPLETED' });
    expect(putTask.status).toBe(404);

    // User 2 attempts to DELETE User 1 task -> 404
    const delTask = await request(app)
      .delete(`/api/tasks/${task1Id}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(delTask.status).toBe(404);

    // Verify User 1's resources are completely unmodified
    const intactProj = await prisma.project.findUnique({ where: { id: proj1Id } });
    expect(intactProj!.name).toBe('Secured Project 1');
    const intactTask = await prisma.task.findUnique({ where: { id: task1Id } });
    expect(intactTask!.status).toBe('PENDING');
  });

  // AC-SEC-05: No response leaks passwordHash or secret fields
  it('never exposes passwordHash in any API response (AC-SEC-05)', async () => {
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(meRes.status).toBe(200);
    const user = meRes.body.user || meRes.body.data;
    expect(user.passwordHash).toBeUndefined();
    expect(user.password).toBeUndefined();
    expect(JSON.stringify(meRes.body)).not.toContain('passwordHash');
  });

  // AC-SEC-10: Helmet security headers present and X-Powered-By absent
  it('includes security headers from Helmet and omits X-Powered-By (AC-SEC-10)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  // AC-SEC-11: Body containing mass-assignment fields (ownerId, userId) returns 400
  it('forbids mass assignment of ownerId or userId in request body (AC-SEC-11)', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Malicious Project',
        ownerId: user2Id,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // AC-AUTH-07: Invalid / expired tokens return 401
  it('returns 401 TOKEN_INVALID for forged token (AC-AUTH-07)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer forged.token.signature');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });
});
