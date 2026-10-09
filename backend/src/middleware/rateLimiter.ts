import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config';

// Rate limiter for login: AC-AUTH-05 (11th failed login -> 429 RATE_LIMITED, successful logins not counted)
export const loginLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_LOGIN_WINDOW_MIN * 60 * 1000,
  limit: config.RATE_LIMIT_LOGIN_MAX,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: true,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many failed login attempts. Please try again later.',
        requestId: (req as any).id,
      },
    });
  },
});

// Rate limiter for register: AC-SEC-07 (10 per hour per IP)
export const registerLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_REGISTER_WINDOW_MIN * 60 * 1000,
  limit: config.RATE_LIMIT_REGISTER_MAX,
  standardHeaders: true,
  legacyHeaders: true,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many registration attempts. Please try again later.',
        requestId: (req as any).id,
      },
    });
  },
});
