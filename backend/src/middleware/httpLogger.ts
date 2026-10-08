import pinoHttp from 'pino-http';
import { logger } from '../lib/logger';

/**
 * HTTP request logger using pino-http.
 * Logs method, path, status, duration, request id, user id.
 * Redaction of sensitive headers is handled by the pino instance.
 */
export const httpLogger = pinoHttp({
  logger,
  // Use the request ID set by our requestId middleware
  genReqId: (req) => req.id || 'unknown',
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, _res, err) => {
    return `${req.method} ${req.url} failed: ${err.message}`;
  },
  // Don't log request body for auth routes (SEC-020)
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      userId: req.raw?.userId,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});
