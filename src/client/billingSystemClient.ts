import axios, { AxiosInstance, AxiosRequestConfig, Method, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { Customer, CreateCustomerInput } from '@/types/customer';
import { UsageRecord, CreateUsageRecordInput } from '@/types/usage';
import {
  NetworkError,
  RequestTimeoutError,
  InvalidResponseError,
  ValidationError,
} from '@/errors/httpErrors';

interface ErrorDetails {
  field: string;
  message: string;
}

interface ErrorResponse {
  status: 'error';
  statusCode: number;
  error: {
    code: string;
    message: string;
    details?: ErrorDetails[];
  };
}

interface SuccessResponse<T> {
  status: 'success';
  statusCode: number;
  data: T;
}

interface CustomError extends Error {
  code: string;
}

export class BillingSystemClient {
  private client: AxiosInstance;

  /**
   * Creates a new BillingSystemClient instance with retry logic
   * @param baseUrl - The base URL for the billing system API
   */
  constructor(baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Configure retry logic
    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        const status = error.response?.status;
        return Boolean(
          status === 408 || // Request Timeout
            status === 429 || // Too Many Requests
            (status && status >= 500 && status < 600), // Server Errors
        );
      },
    });
  }

  /**
   * Handles Axios errors and converts them to appropriate application errors
   * @param error - The Axios error to handle
   * @throws {RequestTimeoutError} When request times out
   * @throws {NetworkError} When there's a network connectivity issue
   * @throws {InvalidResponseError} When server returns 5xx error
   * @throws {ValidationError} When server returns 400 error with validation details
   * @throws {Error} When server returns other errors
   */
  private handleAxiosError(error: AxiosError<ErrorResponse>): never {
    // Handle network and timeout errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new RequestTimeoutError('Request timed out');
      }
      throw new NetworkError('Network error');
    }

    const { status, data } = error.response;

    // Handle server errors (5xx)
    if (status >= 500) {
      throw new InvalidResponseError(`Server error (${status})`);
    }

    // Handle client errors (4xx)
    if (data?.error) {
      const { message, details } = data.error;
      
      // Handle validation errors (400)
      if (status === 400) {
        throw new ValidationError(message, { details });
      }

      // Handle other client errors
      const customError = new Error(message) as CustomError;
      customError.code = data.error.code;
      throw customError;
    }

    // Handle unknown errors
    throw new Error(`Request failed with status ${status}`);
  }

  /**
   * Wrapper API call with retry logic and error handling
   * @param method - The HTTP method to use
   * @param endpoint - The API endpoint to call
   * @param data - Optional data to send with the request
   * @returns The response data
   * @throws {RequestTimeoutError} When request times out
   * @throws {NetworkError} When there's a network connectivity issue
   * @throws {InvalidResponseError} When server returns 5xx error
   * @throws {ValidationError} When server returns 400 error with validation details
   * @throws {Error} When server returns other errors
   */
  private async callApi<T>(
    method: Method,
    endpoint: string,
    data?: unknown,
  ): Promise<T> {
    try {
      const config: AxiosRequestConfig = {
        method,
        url: endpoint,
        ...(data ? { data } : {}),
      };

      const response = await this.client.request<SuccessResponse<T>>(config);
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        this.handleAxiosError(error);
      } else {
        throw error;
      }
    }
  }

  /**
   * Creates a new customer in the billing system
   * @param input - The customer data to create
   * @returns The created customer
   * @throws {RequestTimeoutError} When request times out
   * @throws {NetworkError} When there's a network connectivity issue
   * @throws {InvalidResponseError} When server returns 5xx error
   * @throws {ValidationError} When server returns 400 error with validation details
   * @throws {Error} When server returns other errors
   */
  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    return this.callApi<Customer>('POST', '/customers', input);
  }

  /**
   * Records usage for a customer
   * @param input - The usage data to record
   * @returns The recorded usage
   * @throws {RequestTimeoutError} When request times out
   * @throws {NetworkError} When there's a network connectivity issue
   * @throws {InvalidResponseError} When server returns 5xx error
   * @throws {ValidationError} When server returns 400 error with validation details
   * @throws {Error} When server returns other errors
   */
  async recordUsage(input: CreateUsageRecordInput): Promise<UsageRecord> {
    return this.callApi<UsageRecord>('POST', '/usage', input);
  }
}
