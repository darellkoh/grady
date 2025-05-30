import { Pool } from 'pg';
import { Database } from '../../db/database';
import { Customer, CreateCustomerInput } from '../../types/customer';
import { UsageRecord, CreateUsageRecordRequest } from '../../types/usage';
import { DatabaseError, DuplicateRecordError } from '../../errors/databaseErrors';

// Mock pg Pool
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn()
  }))
}));

describe('Database', () => {
  const mockQuery = jest.fn();

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset mock query implementation
    mockQuery.mockReset();
    
    // Setup mock pool
    const mockPool = new Pool();
    mockPool.query = mockQuery;
    
    // Replace the static pool instance
    (Database as any).pool = mockPool;
  });

  describe('createCustomer', () => {
    const mockCustomerInput: CreateCustomerInput = {
      name: 'Test Customer'
    };

    const mockDbCustomer = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Customer',
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z')
    };

    it('should successfully create a customer', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockDbCustomer] });

      const result = await Database.createCustomer(mockCustomerInput);

      expect(mockQuery).toHaveBeenCalledWith(
        'INSERT INTO customers (name) VALUES ($1) RETURNING *',
        [mockCustomerInput.name]
      );
      expect(result).toEqual({
        id: mockDbCustomer.id,
        name: mockDbCustomer.name,
        createdAt: mockDbCustomer.created_at.toISOString(),
        updatedAt: mockDbCustomer.updated_at.toISOString()
      });
    });

    it('should throw DatabaseError on failure', async () => {
      const dbError = new Error('Database connection failed');
      mockQuery.mockRejectedValueOnce(dbError);

      await expect(Database.createCustomer(mockCustomerInput))
        .rejects.toThrow(DatabaseError);
      await expect(Database.createCustomer(mockCustomerInput))
        .rejects.toMatchObject({
          message: 'Failed to create customer'
        });
    });
  });

  describe('getCustomer', () => {
    const customerId = '123e4567-e89b-12d3-a456-426614174000';
    const mockDbCustomer = {
      id: customerId,
      name: 'Test Customer',
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z')
    };

    it('should return customer when found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockDbCustomer] });

      const result = await Database.getCustomer(customerId);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM customers WHERE id = $1',
        [customerId]
      );
      expect(result).toEqual({
        id: mockDbCustomer.id,
        name: mockDbCustomer.name,
        createdAt: mockDbCustomer.created_at.toISOString(),
        updatedAt: mockDbCustomer.updated_at.toISOString()
      });
    });

    it('should return null when customer not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await Database.getCustomer(customerId);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM customers WHERE id = $1',
        [customerId]
      );
      expect(result).toBeNull();
    });

    it('should throw DatabaseError on failure', async () => {
      const dbError = new Error('Database connection failed');
      mockQuery.mockRejectedValueOnce(dbError);

      await expect(Database.getCustomer(customerId))
        .rejects.toThrow(DatabaseError);
      await expect(Database.getCustomer(customerId))
        .rejects.toMatchObject({
          message: 'Failed to get customer'
        });
    });
  });

  describe('createUsageRecord', () => {
    const mockUsageInput: CreateUsageRecordRequest = {
      customerId: '123e4567-e89b-12d3-a456-426614174000',
      service: 'API Calls',
      serviceCode: 'API_CALLS',
      unitsConsumed: 5,
      pricePerUnit: 0.01,
      requestId: 'req-123'
    };

    const mockDbUsageRecord = {
      id: '456e4567-e89b-12d3-a456-426614174000',
      customer_id: mockUsageInput.customerId,
      service: mockUsageInput.service,
      service_code: mockUsageInput.serviceCode,
      units_consumed: mockUsageInput.unitsConsumed,
      price_per_unit: mockUsageInput.pricePerUnit,
      request_id: mockUsageInput.requestId,
      created_at: new Date('2024-01-01T00:00:00Z')
    };

    it('should successfully create a usage record', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockDbUsageRecord] });

      const result = await Database.createUsageRecord(mockUsageInput);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usage_records'),
        [
          mockUsageInput.customerId,
          mockUsageInput.service,
          mockUsageInput.serviceCode,
          mockUsageInput.unitsConsumed,
          mockUsageInput.pricePerUnit,
          mockUsageInput.requestId
        ]
      );
      expect(result).toEqual({
        id: mockDbUsageRecord.id,
        customerId: mockDbUsageRecord.customer_id,
        service: mockDbUsageRecord.service,
        serviceCode: mockDbUsageRecord.service_code,
        unitsConsumed: mockDbUsageRecord.units_consumed,
        pricePerUnit: Number(mockDbUsageRecord.price_per_unit),
        requestId: mockDbUsageRecord.request_id,
        createdAt: mockDbUsageRecord.created_at.toISOString()
      });
    });

    it('should throw DuplicateRecordError when request ID already exists', async () => {
      // Create a PostgreSQL error with the unique violation code
      const duplicateError = new Error('duplicate key value violates unique constraint');
      Object.defineProperty(duplicateError, 'code', {
        value: '23505',
        writable: true
      });
      
      // Mock the query to reject with the duplicate error
      mockQuery.mockRejectedValueOnce(duplicateError);

      // Make a single call and verify the error
      const error = await Database.createUsageRecord(mockUsageInput).catch(e => e);
      
      expect(error).toBeInstanceOf(DuplicateRecordError);
      expect(error).toMatchObject({
        message: 'Usage record already exists',
        details: {
          requestId: mockUsageInput.requestId
        }
      });
    });

    it('should throw DatabaseError on other failures', async () => {
      // Create a regular database error
      const dbError = new Error('Database connection failed');
      mockQuery.mockRejectedValueOnce(dbError);

      await expect(Database.createUsageRecord(mockUsageInput))
        .rejects.toThrow(DatabaseError);
      await expect(Database.createUsageRecord(mockUsageInput))
        .rejects.toMatchObject({
          message: 'Failed to create usage record'
        });
    });
  });
});
