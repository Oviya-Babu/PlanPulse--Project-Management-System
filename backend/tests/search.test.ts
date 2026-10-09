import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/lib/prisma';

const app = createApp();

describe('Search and Filter API (Slice 5)', () => {
  let userToken: string;
  let userId: string;
  let projWebId: string;
  let projMobileId: string;

  beforeAll(async () => {
    // Register user
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Search Tester',
        email: `search_test_${Date.now()}@example.com`,
        password: 'Password123!',
      });
    expect(regRes.status).toBe(201);
    userToken = regRes.body.token;
    userId = regRes.body.user.id;

    // Create Project 1: "Website Redesign", status: IN_PROGRESS
    const p1 = await prisma.project.create({
      data: {
        ownerId: userId,
        name: 'Website Redesign',
        description: 'Overhaul corporate website',
        status: 'IN_PROGRESS',
      },
    });
    projWebId = p1.id;

    // Create Project 2: "Mobile App 2.0", status: NOT_STARTED
    const p2 = await prisma.project.create({
      data: {
        ownerId: userId,
        name: 'Mobile App 2.0',
        description: 'New Flutter and Android apps',
        status: 'NOT_STARTED',
      },
    });
    projMobileId = p2.id;

    // Create Project 3: "my WEB app", status: COMPLETED
    await prisma.project.create({
      data: {
        ownerId: userId,
        name: 'my WEB app',
        description: 'Internal tool',
        status: 'COMPLETED',
      },
    });

    // Create Tasks under Website:
    // T1: "Build web header", HIGH, PENDING
    await prisma.task.create({
      data: {
        projectId: projWebId,
        name: 'Build web header',
        priority: 'HIGH',
        status: 'PENDING',
      },
    });

    // T2: "Build web footer", MEDIUM, IN_PROGRESS
    await prisma.task.create({
      data: {
        projectId: projWebId,
        name: 'Build web footer',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
      },
    });

    // T3: "Deploy web to staging", HIGH, COMPLETED
    await prisma.task.create({
      data: {
        projectId: projWebId,
        name: 'Deploy web to staging',
        priority: 'HIGH',
        status: 'COMPLETED',
      },
    });

    // T4: "Fix app_v1 bug", LOW, PENDING
    await prisma.task.create({
      data: {
        projectId: projWebId,
        name: 'Fix app_v1 bug',
        priority: 'LOW',
        status: 'PENDING',
      },
    });

    // T5: "Fix app-v1 bug", LOW, PENDING
    await prisma.task.create({
      data: {
        projectId: projWebId,
        name: 'Fix app-v1 bug',
        priority: 'LOW',
        status: 'PENDING',
      },
    });

    // T6: "Reach 100% coverage", HIGH, PENDING
    await prisma.task.create({
      data: {
        projectId: projWebId,
        name: 'Reach 100% coverage',
        priority: 'HIGH',
        status: 'PENDING',
      },
    });

    // T7: "Reach 100 coverage", HIGH, PENDING
    await prisma.task.create({
      data: {
        projectId: projWebId,
        name: 'Reach 100 coverage',
        priority: 'HIGH',
        status: 'PENDING',
      },
    });

    // Under Mobile:
    // T8: "Design mobile wireframes", HIGH, PENDING
    await prisma.task.create({
      data: {
        projectId: projMobileId,
        name: 'Design mobile wireframes',
        priority: 'HIGH',
        status: 'PENDING',
      },
    });
  });

  afterAll(async () => {
    await prisma.task.deleteMany({ where: { project: { ownerId: userId } } });
    await prisma.project.deleteMany({ where: { ownerId: userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  // AC-SRCH-01: Projects case-insensitive search
  it('matches case-insensitive substring on project name and excludes others (AC-SRCH-01)', async () => {
    const res = await request(app)
      .get('/api/projects?search=web')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    const names = res.body.data.map((p: any) => p.name);
    expect(names).toContain('Website Redesign');
    expect(names).toContain('my WEB app');
    expect(names).not.toContain('Mobile App 2.0');
  });

  // AC-SRCH-02: Project status filter
  it('filters projects by exact status (AC-SRCH-02)', async () => {
    const res = await request(app)
      .get('/api/projects?status=IN_PROGRESS')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Website Redesign');
  });

  // AC-SRCH-03: Task combinator search (search, status, priority, projectId)
  it('filters tasks by combinator AND: projectId, status, and priority (AC-SRCH-03)', async () => {
    // Search Website tasks with priority=HIGH and status=PENDING
    const res = await request(app)
      .get(`/api/tasks?projectId=${projWebId}&status=PENDING&priority=HIGH`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    // Should match "Build web header" and "Reach 100% coverage" and "Reach 100 coverage"
    const names = res.body.data.map((t: any) => t.name);
    expect(names).toContain('Build web header');
    expect(names).toContain('Reach 100% coverage');
    expect(names).toContain('Reach 100 coverage');
    // Mobile tasks must not be included
    expect(names).not.toContain('Design mobile wireframes');
    // Deploy web to staging is COMPLETED, must not be included
    expect(names).not.toContain('Deploy web to staging');
  });

  it('filters tasks with search substring combined with status (AC-SRCH-03)', async () => {
    const res = await request(app)
      .get('/api/tasks?search=header&status=PENDING')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Build web header');
  });

  // AC-SRCH-04: Validation of parameters
  it('returns 400 for invalid project status (AC-SRCH-04)', async () => {
    const res = await request(app)
      .get('/api/projects?status=INVALID_STATUS')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid task priority (AC-SRCH-04)', async () => {
    const res = await request(app)
      .get('/api/tasks?priority=SUPER_HIGH')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for search query exceeding 100 characters (AC-SRCH-04)', async () => {
    const longSearch = 'a'.repeat(101);
    const res = await request(app)
      .get(`/api/tasks?search=${longSearch}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for repeated query parameter (AC-SRCH-04)', async () => {
    const res = await request(app)
      .get('/api/tasks?status=PENDING&status=COMPLETED')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('ignores whitespace-only search and returns full results (AC-SRCH-04)', async () => {
    const res = await request(app)
      .get('/api/projects?search=%20%20%20')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    // Should return all 3 projects
    expect(res.body.data.length).toBe(3);
  });

  // AC-SRCH-05: SQL Injection and Wildcard Safety
  it('handles SQL injection patterns safely with zero leaked rows (AC-SRCH-05)', async () => {
    const sqlInjectionStrings = [
      "' OR '1'='1",
      "'; DROP TABLE tasks;--",
      "admin'--",
      "1' OR 1=1--",
    ];

    for (const sql of sqlInjectionStrings) {
      const res = await request(app)
        .get(`/api/tasks?search=${encodeURIComponent(sql)}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0); // No task matches this literal string
    }

    // Verify tasks table is still fully intact!
    const allTasks = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`);
    expect(allTasks.status).toBe(200);
    expect(allTasks.body.data.length).toBe(8);
  });

  it('treats % and _ as literal search characters (AC-SRCH-05)', async () => {
    // Literal % test: searching "100%" should match "Reach 100% coverage" but NOT "Reach 100 coverage"
    const pctRes = await request(app)
      .get(`/api/tasks?search=${encodeURIComponent('100%')}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(pctRes.status).toBe(200);
    expect(pctRes.body.data.length).toBe(1);
    expect(pctRes.body.data[0].name).toBe('Reach 100% coverage');

    // Literal _ test: searching "app_v1" should match "Fix app_v1 bug" but NOT "Fix app-v1 bug"
    const underRes = await request(app)
      .get(`/api/tasks?search=${encodeURIComponent('app_v1')}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(underRes.status).toBe(200);
    expect(underRes.body.data.length).toBe(1);
    expect(underRes.body.data[0].name).toBe('Fix app_v1 bug');
  });
});
