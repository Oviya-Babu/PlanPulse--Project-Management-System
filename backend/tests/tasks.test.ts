import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/lib/prisma';

const app = createApp();

describe('Tasks API (Slice 3)', () => {
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;
  let projectAId: string;
  let projectBId: string;

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'User A Tasks',
        email: `usera_tasks_${Date.now()}@example.com`,
        password: 'Password123!',
      });
    expect(resA.status).toBe(201);
    userAToken = resA.body.token;
    userAId = resA.body.user.id;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'User B Tasks',
        email: `userb_tasks_${Date.now()}@example.com`,
        password: 'Password123!',
      });
    expect(resB.status).toBe(201);
    userBToken = resB.body.token;
    userBId = resB.body.user.id;

    // Create Project for User A
    const projResA = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Project A for Tasks' });
    expect(projResA.status).toBe(201);
    projectAId = projResA.body.data.id;

    // Create Project for User B
    const projResB = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ name: 'Project B for Tasks' });
    expect(projResB.status).toBe(201);
    projectBId = projResB.body.data.id;
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

  describe('POST /api/tasks (AC-TASK-01, 02, 03)', () => {
    it('creates a task with defaults MEDIUM priority and PENDING status (AC-TASK-01)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          projectId: projectAId,
          name: 'Implement Auth Tests',
          description: 'Vitest suite for auth endpoints',
          dueDate: '2026-10-25',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Implement Auth Tests');
      expect(res.body.data.description).toBe('Vitest suite for auth endpoints');
      expect(res.body.data.priority).toBe('MEDIUM');
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.dueDate).toBe('2026-10-25');
      expect(res.body.data.project).toBeDefined();
      expect(res.body.data.project.id).toBe(projectAId);
      expect(res.body.data.project.name).toBe('Project A for Tasks');
    });

    it('rejects foreign or non-existent projectId with 404 PROJECT_NOT_FOUND (AC-TASK-02)', async () => {
      // User A tries to create task in User B's project
      const res1 = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          projectId: projectBId,
          name: 'Hacked Task',
        });

      expect(res1.status).toBe(404);
      expect(res1.body.error.code).toBe('PROJECT_NOT_FOUND');

      // Non-existent UUID
      const res2 = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          projectId: '00000000-0000-0000-0000-000000000000',
          name: 'Ghost Task',
        });

      expect(res2.status).toBe(404);
      expect(res2.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('rejects blank name, invalid priority/status, or malformed dueDate with 400 (AC-TASK-03)', async () => {
      // Blank name
      const res1 = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          projectId: projectAId,
          name: '   ',
        });
      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe('VALIDATION_ERROR');

      // Invalid priority
      const res2 = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          projectId: projectAId,
          name: 'Valid Name',
          priority: 'SUPER_HIGH',
        });
      expect(res2.status).toBe(400);

      // Malformed due date
      const res3 = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          projectId: projectAId,
          name: 'Valid Name',
          dueDate: '2026-02-31',
        });
      expect(res3.status).toBe(400);
    });
  });

  describe('GET, PUT, DELETE /api/tasks & Ownership (AC-TASK-04, 05, 06, 07, 09)', () => {
    let taskAId: string;
    let taskBId: string;

    beforeAll(async () => {
      const resA = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          projectId: projectAId,
          name: 'User A Secret Task',
          priority: 'HIGH',
        });
      taskAId = resA.body.data.id;

      const resB = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          projectId: projectBId,
          name: 'User B Confidential Task',
          priority: 'LOW',
        });
      taskBId = resB.body.data.id;
    });

    it('GET /api/tasks returns only caller tasks, never other users tasks (AC-TASK-04)', async () => {
      const resA = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(resA.status).toBe(200);
      const idsA = resA.body.data.map((t: { id: string }) => t.id);
      expect(idsA).toContain(taskAId);
      expect(idsA).not.toContain(taskBId);
    });

    it('GET /api/tasks/:id of foreign task returns 404 TASK_NOT_FOUND (AC-TASK-04, AC-SEC-03)', async () => {
      // User B tries to view User A's task
      const res = await request(app)
        .get(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TASK_NOT_FOUND');
    });

    it('PUT /api/tasks/:id rejects projectId in body with 400 (AC-TASK-05)', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          projectId: projectBId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('PUT /api/tasks/:id on foreign task returns 404 TASK_NOT_FOUND (AC-TASK-05)', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          name: 'Hacked Name',
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TASK_NOT_FOUND');
    });

    it('PUT /api/tasks/:id marks task COMPLETED idempotently (AC-TASK-07)', async () => {
      // First update to COMPLETED
      const res1 = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'COMPLETED' });

      expect(res1.status).toBe(200);
      expect(res1.body.data.status).toBe('COMPLETED');

      // Second identical update returns 200 unchanged
      const res2 = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'COMPLETED' });

      expect(res2.status).toBe(200);
      expect(res2.body.data.status).toBe('COMPLETED');
    });

    it('GET /api/tasks?projectId= returns tasks for project, 404 on foreign project (AC-TASK-09)', async () => {
      const res1 = await request(app)
        .get(`/api/tasks?projectId=${projectAId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.length).toBeGreaterThan(0);
      res1.body.data.forEach((t: { projectId: string }) => {
        expect(t.projectId).toBe(projectAId);
      });

      // User A querying User B's project ID -> 404
      const res2 = await request(app)
        .get(`/api/tasks?projectId=${projectBId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res2.status).toBe(404);
      expect(res2.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('DELETE /api/tasks/:id deletes own task and protects foreign task (AC-TASK-06)', async () => {
      // User B tries to delete User A's task -> 404
      const delForeign = await request(app)
        .delete(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(delForeign.status).toBe(404);
      expect(delForeign.body.error.code).toBe('TASK_NOT_FOUND');

      // User A deletes own task -> 204
      const delOwn = await request(app)
        .delete(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(delOwn.status).toBe(204);

      // Subsequent GET returns 404
      const getDeleted = await request(app)
        .get(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(getDeleted.status).toBe(404);
      expect(getDeleted.body.error.code).toBe('TASK_NOT_FOUND');
    });
  });
});
