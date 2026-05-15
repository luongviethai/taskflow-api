/**
 * src/errors/app-errors.ts
 *
 * Custom error classes dùng trong Service layer.
 *
 * Tại sao cần?
 * - Service throw Error thường → controller không biết trả status code gì
 * - Custom error mang theo statusCode → error middleware tự trả đúng
 * - Phân biệt "operational error" (404, 403...) vs "programming error" (bug)
 */

// ── Base class ──────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ── Các error cụ thể ────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message: string = 'You do not have permission to perform this action'
  ) {
    super(message, 403);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
  }
}
