import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/lib/prisma';

describe('Authentication API (Slice 1)', () => {
  const app = createApp();
  const testUser = {
    fullName: 'Test Developer',
    email: 'test.auth@example.com',
    password: 'Password123',
  };

  beforeEach(async () => {
    // Clean up test user if exists
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  it('POST /api/auth/register successfully registers and returns user + token (AUTH-008)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.fullName).toBe(testUser.fullName);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });

  it('POST /api/auth/register returns 409 EMAIL_ALREADY_REGISTERED for duplicate email (AUTH-006)', async () => {
    // First registration
    await request(app).post('/api/auth/register').send(testUser);

    // Second registration with same email (case-insensitive)
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Another Name',
        email: 'TEST.AUTH@EXAMPLE.COM',
        password: 'Password999',
      });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('EMAIL_ALREADY_REGISTERED');
    expect(res.body.error.message).toBe('An account with this email already exists.');
  });

  it('POST /api/auth/login successfully authenticates and returns user + token (AUTH-009)', async () => {
    // Register first
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body).toHaveProperty('token');
  });

  it('POST /api/auth/login returns generic 401 INVALID_CREDENTIALS for wrong password (AUTH-010)', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'WrongPassword999',
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe('Invalid email or password.');
  });

  it('GET /api/auth/me returns 200 with authenticated user profile when token is valid (AUTH-015)', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const token = regRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('GET /api/auth/me returns 401 UNAUTHENTICATED when token is missing (AUTH-017)', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('POST /api/auth/logout returns 204 No Content (AUTH-014)', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(204);
  });
});
