import { AppError } from './appError';

/**
 * Error thrown when request validation fails
 * Used for invalid input data or malformed requests
 */
export class ValidationError extends AppError {
  constructor(
    message = 'Invalid request data',
    details?: Record<string, unknown>,
  ) {
    super(400, message, 'BAD_REQUEST', details);
  }
}

/**
 * Error thrown when a requested resource is not found
 * Used for missing customers, records, etc.
 */
export class NotFoundError extends AppError {
  constructor(
    message = 'Resource not found',
    details?: Record<string, unknown>,
  ) {
    super(404, message, 'NOT_FOUND', details);
  }
}

/**
 * Error thrown when attempting to create a duplicate resource
 * Used for idempotency checks
 */
export class DuplicateError extends AppError {
  constructor(
    message = 'Resource already exists',
    details?: Record<string, unknown>,
  ) {
    super(409, message, 'CONFLICT', details);
  }
}

/**
 * Error thrown when there are network connectivity issues
 * Used for external service communication failures
 */
export class NetworkError extends AppError {
  constructor(
    message = 'Network error occurred',
    details?: Record<string, unknown>,
  ) {
    super(503, message, 'SERVICE_UNAVAILABLE', details);
  }
}

/**
 * Error thrown when a request times out
 * Used for long-running operations that exceed time limits
 */
export class RequestTimeoutError extends AppError {
  constructor(
    message = 'Request timed out',
    details?: Record<string, unknown>,
  ) {
    super(504, message, 'GATEWAY_TIMEOUT', details);
  }
}

/**
 * Error thrown when an external service returns an invalid response
 * Used for handling malformed responses from dependencies
 */
export class InvalidResponseError extends AppError {
  constructor(
    message = 'Invalid response from server',
    details?: Record<string, unknown>,
  ) {
    super(502, message, 'BAD_GATEWAY', details);
  }
}

/**
 * Error thrown for unexpected server errors
 * Used as a fallback for unhandled errors
 */
export class InternalServerError extends AppError {
  constructor(
    message = 'Internal server error',
    details?: Record<string, unknown>,
  ) {
    super(500, message, 'INTERNAL_SERVER_ERROR', details);
  }
}
