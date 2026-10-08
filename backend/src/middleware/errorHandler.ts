import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { logger } from '../lib/logger';
import { config } from '../config';

/**
 * Global error handling middleware.
 * Guarantees every error conforms to the PRD §18.1 standard error response envelope:
 * {
 *   "error": {
 *     "code": "STRING_ENUM",
 *     "message": "Human readable message",
 *     "details": [ ... ] // optional
 *   }
 * }
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // If headers already sent, delegate to Express default handler
  if (res.headersSent) {
    return;
  }

  // Handle known AppError domain errors
  if (err instanceof AppError) {
    const responsePayload: {
      error: {
        code: string;
        message: string;
        details?: typeof err.details;
      };
    } = {
      error: {
        code: err.code,
        message: err.message,
      },
    };

    if (err.details && err.details.length > 0) {
      responsePayload.error.details = err.details;
    }

    if (err.statusCode >= 500) {
      logger.error({ err, reqId: req.id, url: req.url }, 'Operational 5xx error encountered');
    }

    res.status(err.statusCode).json(responsePayload);
    return;
  }

  // Handle JSON parse errors from body-parser
  if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON payload in request body.',
      },
    });
    return;
  }

  // Handle payload too large (413)
  if ('type' in err && (err as { type: string }).type === 'entity.too.large') {
    res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request entity exceeds the maximum allowed size (1MB).',
      },
    });
    return;
  }

  // Unhandled / unknown unexpected errors (500)
  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      reqId: req.id,
      url: req.url,
      method: req.method,
    },
    'Unhandled server error'
  );

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message:
        config.NODE_ENV === 'production'
          ? 'An internal server error occurred. Please try again later.'
          : err.message || 'An internal server error occurred.',
    },
  });
}
