import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/lib/prisma';

const app = createApp();

describe('Dashboard API (Slice 4)', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

  beforeAll(async () => {
    // Register User 1
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'User One Dashboard',
        email: `u1_dash_${Date.now()}@example.com`,
        password: 'Password123!',
      });
    expect(res1.status).toBe(201);
    user1Token = res1.body.token;
    user1Id = res1.body.user.id;

    // Register User 2
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'User Two Dashboard',
        email: `u2_dash_${Date.now()}@example.com`,
        password: 'Password123!',
      });
    expect(res2.status).toBe(201);
    user2Token = res2.body.token;
    user2Id = res2.body.user.id;
  });

  afterAll(async () => {
    // Clean up created test data
    await prisma.task.deleteMany({
      where: { project: { ownerId: { in: [user1Id, user2Id] } } },
    });
    await prisma.project.deleteMany({
      where: { ownerId: { in: [user1Id, user2Id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [user1Id, user2Id] } },
    });
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
  });

  it('returns five zeros for a newly created user (AC-DASH-03)', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      totalProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      projectsInProgress: 0,
      inProgressTasks: 0,
    });
  });

  it('returns accurate numeric metrics for user with projects and tasks (AC-DASH-01)', async () => {
    // User 1 creates 2 projects: 1 IN_PROGRESS, 1 NOT_STARTED
    const proj1 = await prisma.project.create({
      data: {
        ownerId: user1Id,
        name: 'Project Alpha Dash',
        status: 'IN_PROGRESS',
      },
    });
    const proj2 = await prisma.project.create({
      data: {
        ownerId: user1Id,
        name: 'Project Beta Dash',
        status: 'NOT_STARTED',
      },
    });

    // Under Proj 1: 1 COMPLETED, 1 IN_PROGRESS, 1 PENDING
    await prisma.task.create({
      data: {
        projectId: proj1.id,
        name: 'Task A1',
        status: 'COMPLETED',
      },
    });
    await prisma.task.create({
      data: {
        projectId: proj1.id,
        name: 'Task A2',
        status: 'IN_PROGRESS',
      },
    });
    await prisma.task.create({
      data: {
        projectId: proj1.id,
        name: 'Task A3',
        status: 'PENDING',
      },
    });

    // Under Proj 2: 2 PENDING
    await prisma.task.create({
      data: {
        projectId: proj2.id,
        name: 'Task B1',
        status: 'PENDING',
      },
    });
    await prisma.task.create({
      data: {
        projectId: proj2.id,
        name: 'Task B2',
        status: 'PENDING',
      },
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      totalProjects: 2,
      totalTasks: 5,
      completedTasks: 1,
      pendingTasks: 3,
      projectsInProgress: 1,
      inProgressTasks: 1,
    });

    // Mathematical consistency check: totalTasks = pending + inProgress + completed
    expect(res.body.data.totalTasks).toBe(
      res.body.data.pendingTasks + res.body.data.inProgressTasks + res.body.data.completedTasks
    );
  });

  it('strictly isolates metrics between different users (AC-DASH-02)', async () => {
    // User 2 creates 3 projects and 4 pending tasks
    const p2 = await prisma.project.create({
      data: {
        ownerId: user2Id,
        name: 'U2 Project 1',
        status: 'NOT_STARTED',
      },
    });
    await prisma.project.create({
      data: {
        ownerId: user2Id,
        name: 'U2 Project 2',
        status: 'IN_PROGRESS',
      },
    });
    await prisma.project.create({
      data: {
        ownerId: user2Id,
        name: 'U2 Project 3',
        status: 'IN_PROGRESS',
      },
    });

    for (let i = 1; i <= 4; i++) {
      await prisma.task.create({
        data: {
          projectId: p2.id,
          name: `U2 Task ${i}`,
          status: 'PENDING',
        },
      });
    }

    // Check User 2 dashboard
    const res2 = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${user2Token}`);
    expect(res2.body.data).toEqual({
      totalProjects: 3,
      totalTasks: 4,
      completedTasks: 0,
      pendingTasks: 4,
      projectsInProgress: 2,
      inProgressTasks: 0,
    });

    // Check User 1 dashboard is unaffected by User 2's data
    const res1 = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res1.body.data).toEqual({
      totalProjects: 2,
      totalTasks: 5,
      completedTasks: 1,
      pendingTasks: 3,
      projectsInProgress: 1,
      inProgressTasks: 1,
    });
  });

  it('updates dashboard counts dynamically after create, complete, and delete actions (AC-DASH-04)', async () => {
    // Register a fresh User 3 for dynamic mutation test
    const res3 = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'User Three Dashboard',
        email: `u3_dash_${Date.now()}@example.com`,
        password: 'Password123!',
      });
    const user3Token = res3.body.token;

    // Initially 0
    let dash = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${user3Token}`);
    expect(dash.body.data.totalProjects).toBe(0);

    // Create a project via API
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${user3Token}`)
      .send({
        name: 'Dynamic Test Project',
        status: 'IN_PROGRESS',
      });
    const projectId = projRes.body.data.id;

    // Check dashboard: 1 project, 0 tasks, 1 in progress project
    dash = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${user3Token}`);
    expect(dash.body.data.totalProjects).toBe(1);
    expect(dash.body.data.projectsInProgress).toBe(1);
    expect(dash.body.data.totalTasks).toBe(0);

    // Create a task
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user3Token}`)
      .send({
        projectId,
        name: 'Dynamic Task 1',
        status: 'PENDING',
      });
    const taskId = taskRes.body.data.id;

    // Check dashboard: 1 totalTask, 1 pendingTask
    dash = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${user3Token}`);
    expect(dash.body.data.totalTasks).toBe(1);
    expect(dash.body.data.pendingTasks).toBe(1);
    expect(dash.body.data.completedTasks).toBe(0);

    // Complete the task
    await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user3Token}`)
      .send({ status: 'COMPLETED' });

    dash = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${user3Token}`);
    expect(dash.body.data.totalTasks).toBe(1);
    expect(dash.body.data.pendingTasks).toBe(0);
    expect(dash.body.data.completedTasks).toBe(1);

    // Delete the task
    await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user3Token}`);

    dash = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${user3Token}`);
    expect(dash.body.data.totalTasks).toBe(0);
    expect(dash.body.data.completedTasks).toBe(0);
  });
});
