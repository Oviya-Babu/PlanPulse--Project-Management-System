import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/lib/prisma';

const app = createApp();

describe('Projects API (Slice 2)', () => {
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'User A',
        email: `usera_${Date.now()}@example.com`,
        password: 'Password123!',
      });
    expect(resA.status).toBe(201);
    userAToken = resA.body.token;
    userAId = resA.body.user.id;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'User B',
        email: `userb_${Date.now()}@example.com`,
        password: 'Password123!',
      });
    expect(resB.status).toBe(201);
    userBToken = resB.body.token;
    userBId = resB.body.user.id;
  });

  afterAll(async () => {
    const ids = [userAId, userBId].filter(Boolean);
    if (ids.length > 0) {
      await prisma.task.deleteMany({
        where: {
          project: {
            ownerId: { in: ids },
          },
        },
      });
      await prisma.project.deleteMany({
        where: {
          ownerId: { in: ids },
        },
      });
      await prisma.user.deleteMany({
        where: {
          id: { in: ids },
        },
      });
    }
  });

  describe('POST /api/projects (AC-PROJ-01, 02, 03)', () => {
    it('creates a project with valid data and default NOT_STARTED status (AC-PROJ-01)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'Alpha Project',
          description: 'A great test project',
          startDate: '2026-10-10',
          endDate: '2026-10-20',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Alpha Project');
      expect(res.body.data.description).toBe('A great test project');
      expect(res.body.data.status).toBe('NOT_STARTED');
      expect(res.body.data.startDate).toBe('2026-10-10');
      expect(res.body.data.endDate).toBe('2026-10-20');
      expect(res.body.data.taskCount).toBe(0);
      expect(res.body.data.completedTaskCount).toBe(0);
    });

    it('rejects extra fields like id or ownerId with 400 (AC-PROJ-01, AC-SEC-11)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'Hack Project',
          ownerId: userBId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects missing or empty/whitespace name with 400 (AC-PROJ-02)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: '   ',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid dates or endDate before startDate with 400 (AC-PROJ-03)', async () => {
      // endDate before startDate
      const res1 = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'Time Travel',
          startDate: '2026-10-20',
          endDate: '2026-10-10',
        });

      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe('VALIDATION_ERROR');

      // Impossible date
      const res2 = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'Leap Year Bug',
          startDate: '2026-02-30',
        });

      expect(res2.status).toBe(400);
      expect(res2.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('accepts equal startDate and endDate (AC-PROJ-03)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'One Day Sprint',
          startDate: '2026-10-15',
          endDate: '2026-10-15',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.startDate).toBe('2026-10-15');
      expect(res.body.data.endDate).toBe('2026-10-15');
    });
  });

  describe('GET /api/projects & Ownership (AC-PROJ-04, 09)', () => {
    let projectAId: string;
    let projectBId: string;

    beforeAll(async () => {
      const resA = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'User A Secret Project' });
      projectAId = resA.body.data.id;

      const resB = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ name: 'User B Confidential Project' });
      projectBId = resB.body.data.id;

      // Add a task to project A
      await prisma.task.create({
        data: {
          projectId: projectAId,
          name: 'Task 1',
          status: 'COMPLETED',
        },
      });
      await prisma.task.create({
        data: {
          projectId: projectAId,
          name: 'Task 2',
          status: 'PENDING',
        },
      });
    });

    it('returns only caller projects, never other users projects (AC-PROJ-04)', async () => {
      const resA = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(resA.status).toBe(200);
      const projectIdsA = resA.body.data.map((p: { id: string }) => p.id);
      expect(projectIdsA).toContain(projectAId);
      expect(projectIdsA).not.toContain(projectBId);

      const resB = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(resB.status).toBe(200);
      const projectIdsB = resB.body.data.map((p: { id: string }) => p.id);
      expect(projectIdsB).toContain(projectBId);
      expect(projectIdsB).not.toContain(projectAId);
    });

    it('returns accurate taskCount and completedTaskCount (AC-PROJ-09)', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectAId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.taskCount).toBe(2);
      expect(res.body.data.completedTaskCount).toBe(1);
    });
  });

  describe('GET, PUT, DELETE with Foreign/Missing ID (AC-PROJ-05, 06, 07)', () => {
    let projectAId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'Project to Test IDOR',
          startDate: '2026-10-01',
          endDate: '2026-10-31',
        });
      projectAId = res.body.data.id;
    });

    it('returns 404 PROJECT_NOT_FOUND when accessing foreign project (AC-PROJ-05, AC-SEC-03)', async () => {
      // User B tries to GET User A's project
      const getRes = await request(app)
        .get(`/api/projects/${projectAId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(getRes.status).toBe(404);
      expect(getRes.body.error.code).toBe('PROJECT_NOT_FOUND');

      // User B tries to PUT User A's project
      const putRes = await request(app)
        .put(`/api/projects/${projectAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ name: 'Hacked Name' });
      expect(putRes.status).toBe(404);
      expect(putRes.body.error.code).toBe('PROJECT_NOT_FOUND');

      // User B tries to DELETE User A's project
      const delRes = await request(app)
        .delete(`/api/projects/${projectAId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(delRes.status).toBe(404);
      expect(delRes.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('supports partial updates via PUT (AC-PROJ-06)', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectAId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_PROGRESS');
      expect(res.body.data.name).toBe('Project to Test IDOR');
    });

    it('rejects empty update body with 400 (AC-PROJ-06)', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectAId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('deletes own project and cascade deletes tasks (AC-PROJ-07)', async () => {
      // Add tasks to project
      await prisma.task.create({
        data: { projectId: projectAId, name: 'Task to be cascaded' },
      });

      const delRes = await request(app)
        .delete(`/api/projects/${projectAId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(delRes.status).toBe(204);

      // Subsequent GET returns 404
      const getRes = await request(app)
        .get(`/api/projects/${projectAId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(getRes.status).toBe(404);
      expect(getRes.body.error.code).toBe('PROJECT_NOT_FOUND');
    });
  });
});
