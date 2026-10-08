import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { config } from '../config';
import { AuthenticationError, ConflictError } from '../errors';
import { RegisterInput, LoginInput } from '../schemas/auth.schemas';

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

/**
 * Generates an HS256 JWT token with standard subject and email claims.
 */
export function generateToken(user: { id: string; email: string }): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    config.JWT_SECRET,
    {
      expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      algorithm: 'HS256',
    }
  );
}

/**
 * Registers a new user with bcrypt password hashing (cost 12).
 * Throws EMAIL_ALREADY_REGISTERED (409) if email is already taken.
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  const normalizedEmail = input.email.trim().toLowerCase();

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ConflictError(
      'EMAIL_ALREADY_REGISTERED',
      'An account with this email already exists.'
    );
  }

  // Hash password with bcrypt cost 12 (AUTH-004)
  const passwordHash = await bcrypt.hash(input.password, config.BCRYPT_COST);

  // Create user
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName.trim(),
      email: normalizedEmail,
      passwordHash,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      createdAt: true,
    },
  });

  const token = generateToken(user);

  return { user, token };
}

/**
 * Logs in a user. Returns generic 401 for ANY credential failure to prevent user enumeration.
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AuthenticationError(
      'INVALID_CREDENTIALS',
      'Invalid email or password.'
    );
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AuthenticationError(
      'INVALID_CREDENTIALS',
      'Invalid email or password.'
    );
  }

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
}

/**
 * Fetches user profile for /api/auth/me.
 */
export async function getUserById(userId: string): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AuthenticationError('UNAUTHENTICATED', 'User account not found.');
  }

  return user;
}
