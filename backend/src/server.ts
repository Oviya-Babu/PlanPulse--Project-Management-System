import { app } from './app';
import { config } from './config';
import { logger } from './lib/logger';
import prisma from './lib/prisma';

const server = app.listen(config.PORT, '0.0.0.0', () => {
  logger.info(`🚀 PMS Backend server listening on http://0.0.0.0:${config.PORT} [${config.NODE_ENV}]`);
});

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during database disconnection.');
      process.exit(1);
    }
  });

  // Force exit after 10s if shutdown hangs
  setTimeout(() => {
    logger.error('Forced shutdown timeout reached. Terminating process.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled Rejection at Promise');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception thrown');
  process.exit(1);
});
