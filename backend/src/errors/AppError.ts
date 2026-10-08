/**
 * Domain error types for the PMS backend.
 * These are mapped to HTTP status codes and error codes by the error handler middleware.
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'INVALID_CREDENTIALS'
  | 'FORBIDDEN'
  | 'PROJECT_NOT_FOUND'
  | 'TASK_NOT_FOUND'
  | 'NOT_FOUND'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

export interface FieldError {
  field: string;
  message: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: FieldError[];
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: FieldError[],
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: FieldError[]) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(code: 'PROJECT_NOT_FOUND' | 'TASK_NOT_FOUND' | 'NOT_FOUND', message: string) {
    super(404, code, message);
  }
}

export class ConflictError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(409, code, message);
  }
}

export class AuthenticationError extends AppError {
  constructor(code: 'UNAUTHENTICATED' | 'TOKEN_INVALID' | 'TOKEN_EXPIRED' | 'INVALID_CREDENTIALS', message: string) {
    const statusCode = 401;
    super(statusCode, code, message);
  }
}
