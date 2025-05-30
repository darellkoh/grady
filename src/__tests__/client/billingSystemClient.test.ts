import axios from 'axios';
import axiosRetry from 'axios-retry';
import { BillingSystemClient } from '../../client/billingSystemClient';
import { Customer, CreateCustomerInput } from '../../types/customer';
import { UsageRecord, CreateUsageRecordInput } from '../../types/usage';
import {
  NetworkError,
  RequestTimeoutError,
  InvalidResponseError,
  ValidationError,
} from '../../errors/httpErrors';

// Mock axios and axios-retry
jest.mock('axios');
jest.mock('axios-retry');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAxiosRetry = axiosRetry as unknown as jest.Mock;

describe('BillingSystemClient', () => {
  let client: BillingSystemClient;
  const baseUrl = 'http://api.example.com';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createCustomer', () => {
    const mockCustomerInput: CreateCustomerInput = {
      name: 'Milo Berry',
    };

    const mockCustomerResponse: Customer = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Milo Berry',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should successfully create a customer', async () => {
      // Mock successful response
      const mockAxiosInstance = {
        request: jest.fn().mockResolvedValue({
          data: {
            status: 'success',
            statusCode: 200,
            data: mockCustomerResponse,
          },
        }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
      mockedAxiosRetry.mockImplementation(() => {});

      // Create client after setting up mocks
      client = new BillingSystemClient(baseUrl);

      const result = await client.createCustomer(mockCustomerInput);
      expect(result).toEqual(mockCustomerResponse);
    });

    it('should handle validation errors', async () => {
      const validationError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            status: 'error',
            statusCode: 400,
            error: {
              code: 'BAD_REQUEST',
              message: 'Invalid input',
              details: [{
                field: 'name',
                message: 'Name is required'
              }]
            }
          }
        }
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      // Mock validation error response
      const mockAxiosInstance = {
        request: jest.fn().mockRejectedValue(validationError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
      mockedAxiosRetry.mockImplementation(() => {});

      // Create client after setting up mocks
      client = new BillingSystemClient(baseUrl);

      await expect(client.createCustomer(mockCustomerInput)).rejects.toThrow(ValidationError);
    });

    it('should handle network errors', async () => {
      const timeoutError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        response: undefined
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      // Mock network error
      const mockAxiosInstance = {
        request: jest.fn().mockRejectedValue(timeoutError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
      mockedAxiosRetry.mockImplementation(() => {});

      // Create client after setting up mocks
      client = new BillingSystemClient(baseUrl);

      await expect(client.createCustomer(mockCustomerInput)).rejects.toThrow(RequestTimeoutError);
    });
  });

  describe('recordUsage', () => {
    const mockUsageInput: CreateUsageRecordInput = {
      customerId: '123e4567-e89b-12d3-a456-426614174000',
      service: 'API Calls',
      unitsConsumed: 5,
      pricePerUnit: 0.01,
    };

    const mockUsageResponse: UsageRecord = {
      id: '456e4567-e89b-12d3-a456-426614174000',
      customerId: '123e4567-e89b-12d3-a456-426614174000',
      service: 'API Calls',
      serviceCode: 'API_CALLS',
      unitsConsumed: 5,
      pricePerUnit: 0.01,
      requestId: 'req-123',
      createdAt: new Date().toISOString(),
    };

    it('should successfully record usage if the usage has not been recorded', async () => {
      // Mock successful response
      const mockAxiosInstance = {
        request: jest.fn().mockResolvedValue({
          data: {
            status: 'success',
            statusCode: 200,
            data: mockUsageResponse,
          },
        }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
      mockedAxiosRetry.mockImplementation(() => {});

      // Create client after setting up mocks
      client = new BillingSystemClient(baseUrl);

      const result = await client.recordUsage(mockUsageInput);
      expect(result).toEqual(mockUsageResponse);
    });

    it('should not record the usage if it is already recorded', async () => {
      const duplicateError = {
        isAxiosError: true,
        response: {
          status: 409,
          data: {
            status: 'error',
            statusCode: 409,
            error: {
              code: 'DUPLICATE_RECORD',
              message: 'Usage record already exists',
              details: {
                requestId: 'req-123'
              }
            }
          }
        }
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      // Mock duplicate record error response
      const mockAxiosInstance = {
        request: jest.fn().mockRejectedValue(duplicateError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
      mockedAxiosRetry.mockImplementation(() => {});

      // Create client after setting up mocks
      client = new BillingSystemClient(baseUrl);

      // Try to record usage with a request ID that's already been used
      const duplicateUsageInput = {
        ...mockUsageInput,
        requestId: 'req-123'
      };

      await expect(client.recordUsage(duplicateUsageInput)).rejects.toThrow(Error);
      await expect(client.recordUsage(duplicateUsageInput)).rejects.toMatchObject({
        code: 'DUPLICATE_RECORD',
        message: 'Usage record already exists'
      });
    });

    it('should handle server errors', async () => {
      const serverError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {
            status: 'error',
            statusCode: 500,
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Internal server error'
            }
          }
        }
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      // Mock server error response
      const mockAxiosInstance = {
        request: jest.fn().mockRejectedValue(serverError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
      mockedAxiosRetry.mockImplementation(() => {});

      // Create client after setting up mocks
      client = new BillingSystemClient(baseUrl);

      await expect(client.recordUsage(mockUsageInput)).rejects.toThrow(InvalidResponseError);
    });

    it('should handle network connectivity issues', async () => {
      const networkError = {
        isAxiosError: true,
        code: 'ECONNREFUSED',
        response: undefined
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      // Mock network error
      const mockAxiosInstance = {
        request: jest.fn().mockRejectedValue(networkError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
      mockedAxiosRetry.mockImplementation(() => {});

      // Create client after setting up mocks
      client = new BillingSystemClient(baseUrl);

      await expect(client.recordUsage(mockUsageInput)).rejects.toThrow(NetworkError);
    });

    it('should throw a validation error when invalid inputs are provided', async () => {
      const invalidInput = {
        customerId: 1090190,
        service: 'API Calls',
        unitsConsumed: -500,
        pricePerUnit: -0.01,
      };

      const validationError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            status: 'error',
            statusCode: 400,
            error: {
              code: 'BAD_REQUEST',
              message: 'Invalid input',
              details: [
                {
                  field: 'customerId',
                  message: 'Must be a valid UUID'
                },
                {
                  field: 'unitsConsumed',
                  message: 'Must be a positive number'
                },
                {
                  field: 'pricePerUnit',
                  message: 'Must be a positive number'
                }
              ]
            }
          }
        }
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      // Mock validation error response
      const mockAxiosInstance = {
        request: jest.fn().mockRejectedValue(validationError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
      mockedAxiosRetry.mockImplementation(() => {});

      // Create client after setting up mocks
      client = new BillingSystemClient(baseUrl);

      await expect(client.recordUsage(invalidInput)).rejects.toThrow(ValidationError);
    });
  });
});
