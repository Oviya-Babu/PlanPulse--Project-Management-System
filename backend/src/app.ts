import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { requestId } from './middleware/requestId';
import { httpLogger } from './middleware/httpLogger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import projectsRoutes from './routes/projects.routes';
import tasksRoutes from './routes/tasks.routes';
import dashboardRoutes from './routes/dashboard.routes';

export function createApp(): Express {
  const app = express();

  // Trust proxy configuration for Render topology (1 reverse proxy hop)
  // On Render (RENDER=true) or production or when TRUST_PROXY is configured, trust 1 front-facing proxy hop.
  if (config.TRUST_PROXY === '1' || process.env.RENDER === 'true') {
    app.set('trust proxy', 1);
  } else if (config.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  } else if (!isNaN(Number(config.TRUST_PROXY)) && Number(config.TRUST_PROXY) > 0) {
    app.set('trust proxy', Number(config.TRUST_PROXY));
  } else if (config.NODE_ENV === 'production' && config.TRUST_PROXY !== '0') {
    app.set('trust proxy', 1);
  } else if (config.TRUST_PROXY !== '0' && config.TRUST_PROXY !== 'false') {
    app.set('trust proxy', config.TRUST_PROXY);
  }

  // Security Headers via Helmet (SEC-004)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS Configuration (SEC-005)
  const parsedOrigins = config.CORS_ORIGIN.split(',')
    .map((o) => o.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, ''))
    .filter(Boolean);

  const standardOrigins = [
    'https://plan-pulse-project-management-syste.vercel.app',
    'https://plan-pulse-project-management-system.vercel.app',
    'https://plan-pulse-project-management-system-nxfwvyzvr.vercel.app',
    'https://planpulse-project-management-system.vercel.app',
    'https://planpulse.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
  ];

  const allowedOriginsSet = new Set([...parsedOrigins, ...standardOrigins]);
  // Matches any Vercel domain associated with PlanPulse (including truncated or preview hashes)
  const vercelDomainRegex = /^https:\/\/[a-z0-9-]*plan[-]?pulse[a-z0-9-]*\.vercel\.app$/i;

  const isOriginAllowed = (origin: string): boolean => {
    const normalized = origin.trim().replace(/\/+$/, '');
    if (allowedOriginsSet.has(normalized)) return true;
    if (vercelDomainRegex.test(normalized)) return true;
    return false;
  };

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (isOriginAllowed(origin)) {
          return callback(null, true);
        }
        // Do not throw Error; rejecting CORS cleanly omits headers without triggering HTTP 500
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
    })
  );

  // Request tracing & logging
  app.use(requestId);
  app.use(httpLogger);

  // Body parsers with 1MB limit
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // API Routes
  app.use('/api', healthRoutes);
  app.use('/api', authRoutes);
  app.use('/api/projects', projectsRoutes);
  app.use('/api/tasks', tasksRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Central error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
