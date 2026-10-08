import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

/**
 * Adds a unique request ID to each request for tracing.
 * The ID is also set in the response header X-Request-Id.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) || uuidv4();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}

// Extend Express Request to include `id`
declare global {
  namespace Express {
    interface Request {
      id?: string;
      userId?: string;
    }
  }
}
