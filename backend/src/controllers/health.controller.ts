import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const timestamp = new Date().toISOString();

  try {
    // Perform simple ping to test database connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp,
    });
  } catch (error) {
    logger.error({ error }, 'Health check failed: database unreachable');

    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      timestamp,
      error: 'Database connection failed',
    });
  }
}
