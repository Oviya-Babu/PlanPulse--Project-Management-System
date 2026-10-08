import pino from 'pino';
import { config } from '../config';

export const logger = pino({
  level: config.LOG_LEVEL,
  // Redact sensitive fields per SEC-020
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.password',
      'req.body.passwordHash',
      'req.body.token',
      'res.headers["set-cookie"]',
    ],
    censor: '[REDACTED]',
  },
  transport:
    config.NODE_ENV === 'development'
      ? {
          target: 'pino/file',
          options: { destination: 1 }, // stdout
        }
      : undefined,
  serializers: {
    err: pino.stdSerializers.err,
  },
});
