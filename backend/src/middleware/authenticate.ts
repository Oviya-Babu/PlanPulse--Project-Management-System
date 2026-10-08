import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticationError } from '../errors';
import prisma from '../lib/prisma';

interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Authentication middleware that verifies the JWT Bearer token.
 * Attaches req.userId and req.user to the Request object.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(
      new AuthenticationError(
        'UNAUTHENTICATED',
        'Authentication token is missing. Please provide a Bearer token.'
      )
    );
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(
      new AuthenticationError(
        'TOKEN_INVALID',
        'Authorization header format must be: Bearer <token>'
      )
    );
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as JwtPayload;

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return next(
        new AuthenticationError(
          'UNAUTHENTICATED',
          'The user associated with this token no longer exists.'
        )
      );
    }

    req.userId = user.id;
    (req as Request & { user: typeof user }).user = user;

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(
        new AuthenticationError(
          'TOKEN_EXPIRED',
          'Your session has expired. Please log in again.'
        )
      );
    }

    if (err instanceof jwt.JsonWebTokenError) {
      return next(
        new AuthenticationError('TOKEN_INVALID', 'Invalid authentication token.')
      );
    }

    next(err);
  }
}
