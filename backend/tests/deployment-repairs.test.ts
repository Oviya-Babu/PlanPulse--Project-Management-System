import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { registerSchema } from '../src/schemas/auth.schemas';

describe('Deployment Repairs Suite (CORS, Proxy, Registration Contract)', () => {
  const app = createApp();

  describe('CORS & Preflight Handling', () => {
    it('returns 204 with CORS headers for production Vercel origin', async () => {
      const vercelOrigin = 'https://plan-pulse-project-management-system-nxfwvyzvr.vercel.app';
      const res = await request(app)
        .options('/api/auth/register')
        .set('Origin', vercelOrigin)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(vercelOrigin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['access-control-allow-methods']).toContain('POST');
    });

    it('returns 204 with CORS headers for truncated Vercel domain (plan-pulse-project-management-syste.vercel.app)', async () => {
      const truncatedOrigin = 'https://plan-pulse-project-management-syste.vercel.app';
      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', truncatedOrigin)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(truncatedOrigin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('returns 204 with CORS headers for Vercel preview domain pattern', async () => {
      const previewOrigin = 'https://plan-pulse-project-management-system-preview-123.vercel.app';
      const res = await request(app)
        .options('/api/health')
        .set('Origin', previewOrigin)
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(previewOrigin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('does NOT return 500 when request origin is not in allowed origins', async () => {
      const unauthorizedOrigin = 'https://unauthorized-attacker-site.com';
      const res = await request(app)
        .options('/api/health')
        .set('Origin', unauthorizedOrigin)
        .set('Access-Control-Request-Method', 'GET');

      // Must not crash with 500 INTERNAL_ERROR
      expect(res.status).not.toBe(500);
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('includes CORS headers on regular GET request from allowed Vercel origin', async () => {
      const vercelOrigin = 'https://plan-pulse-project-management-system-nxfwvyzvr.vercel.app';
      const res = await request(app)
        .get('/api/health')
        .set('Origin', vercelOrigin);

      expect(res.headers['access-control-allow-origin']).toBe(vercelOrigin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Proxy Trust Configuration', () => {
    it('configures trust proxy to 1 when on Render (RENDER=true)', () => {
      const originalRender = process.env.RENDER;
      try {
        process.env.RENDER = 'true';
        const renderApp = createApp();
        expect(renderApp.get('trust proxy')).toBe(1);
      } finally {
        if (originalRender !== undefined) {
          process.env.RENDER = originalRender;
        } else {
          delete process.env.RENDER;
        }
      }
    });
  });

  describe('Registration Contract & Schema Validation', () => {
    it('accepts valid registration payload with fullName', () => {
      const payload = {
        fullName: 'Jane Doe',
        email: 'JANE@example.com',
        password: 'Password123',
      };
      const result = registerSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe('Jane Doe');
        expect(result.data.email).toBe('jane@example.com');
      }
    });

    it('accepts registration payload with name alias and maps it to fullName', () => {
      const payload = {
        name: 'Jane Alias',
        email: 'alias@example.com',
        password: 'Password123',
      };
      const result = registerSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe('Jane Alias');
        expect(result.data.email).toBe('alias@example.com');
      }
    });

    it('rejects registration payload missing both fullName and name with clear error', () => {
      const payload = {
        email: 'missing@example.com',
        password: 'Password123',
      };
      const result = registerSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors;
        const nameError = errors.find((e) => e.path.includes('fullName'));
        expect(nameError).toBeDefined();
        expect(nameError?.message).toBe('Full name is required.');
      }
    });

    it('rejects invalid password according to PRD policy', () => {
      const payload = {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'short', // less than 8 characters, no digits
      };
      const result = registerSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
