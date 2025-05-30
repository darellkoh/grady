import { AppError } from './appError';

/**
 * Base error class for all database-related errors
 * Represents general database operation failures
 */
export class DatabaseError extends AppError {
  constructor(
    message = 'Database error occurred',
    details?: Record<string, unknown>,
  ) {
    super(500, message, 'DATABASE_ERROR', details);
  }
}

/**
 * Error thrown when attempting to create a duplicate record
 * Used for idempotency checks in usage records
 */
export class DuplicateRecordError extends AppError {
  constructor(
    message = 'Record already exists',
    details?: Record<string, unknown>,
  ) {
    super(409, message, 'DUPLICATE_RECORD', details);
  }
}

