import { Response } from 'express';
import { AppError } from '@/errors/appError';

/**
 * Base response class for all API responses
 * Provides consistent response structure and JSON serialization
 */
export class ApiResponse<T> {
  /**
   * Creates a new ApiResponse instance
   * @param statusCode - HTTP status code for the response
   * @param data - The response data
   * @param message - Optional success message
   */
  constructor(
    public readonly statusCode: number,
    public readonly data: T,
    public readonly message?: string
  ) {}

  /**
   * Converts the response to a JSON-serializable object
   * @returns Object with status, statusCode, and response data
   */
  toJSON(): Record<string, unknown> {
    return {
      status: 'success',
      statusCode: this.statusCode,
      ...(this.message ? { message: this.message } : {}),
      data: this.data
    };
  }

  /**
   * Sends the response using Express response object
   * @param res - Express response object
   */
  send(res: Response): Response {
    return res.status(this.statusCode).json(this.toJSON());
  }

  /**
   * Creates a success response with 200 status code
   */
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse(200, data, message);
  }

  /**
   * Creates a created response with 201 status code
   */
  static created<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse(201, data, message);
  }

  /**
   * Creates an error response from an AppError
   */
  static error(error: AppError, res: Response): Response {
    const response = {
      status: 'error',
      statusCode: error.statusCode,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {})
      }
    };
    return res.status(error.statusCode).json(response);
  }
}
