/**
 * Base error class for all application errors
 * Provides consistent error structure and JSON serialization
 * All custom errors in the application should extend this class
 */
export class AppError extends Error {
  /**
   * Optional details object for additional error information
   * Can contain any structured data relevant to the error
   */
  public details?: Record<string, unknown>;

  /**
   * Creates a new AppError instance
   * @param statusCode - HTTP status code for the error
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   * @param details - Optional additional error details
   */
  constructor(
    public statusCode: number,
    message: string,
    public code: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }

  /**
   * Converts the error to a JSON-serializable object
   * @returns Object with status, statusCode, and error details
   */
  toJSON(): Record<string, unknown> {
    const error: Record<string, unknown> = {
      code: this.code,
      message: this.message,
    };

    if (this.details) {
      error.details = this.details;
    }

    return {
      status: 'error',
      statusCode: this.statusCode,
      error,
    };
  }
} 
