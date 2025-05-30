import request from 'supertest';
import { app } from '../../api/server';
import { DuplicateRecordError } from '../../errors/databaseErrors';

// Track request IDs for duplicate detection
const usedRequestIds = new Set<string>();

// Mock the Database class
jest.mock('../../db/database', () => ({
  Database: {
    createCustomer: jest.fn().mockImplementation((input) => ({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: input.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })),
    getCustomer: jest.fn().mockImplementation((id) => {
      if (id === '123e4567-e89b-12d3-a456-426614174999') {
        return null;
      }
      return {
        id,
        name: 'Test Customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }),
    createUsageRecord: jest.fn().mockImplementation((record) => {
      // Check if request ID has been used before
      if (usedRequestIds.has(record.requestId)) {
        throw new DuplicateRecordError('Usage record already exists', {
          requestId: record.requestId
        });
      }
      
      // Add request ID to used set
      usedRequestIds.add(record.requestId);
      
      return {
        id: '123e4567-e89b-12d3-a456-426614174001',
        customerId: record.customerId,
        service: record.service,
        serviceCode: 'DB_HOST',
        unitsConsumed: record.unitsConsumed,
        pricePerUnit: record.pricePerUnit,
        requestId: record.requestId,
        createdAt: new Date().toISOString()
      };
    })
  }
}));

describe('API Endpoints', () => {
  beforeEach(() => {
    // Clear used request IDs before each test
    usedRequestIds.clear();
  });

  describe('POST /customers', () => {
    it('should create a new customer', async () => {
      const response = await request(app)
        .post('/customers')
        .send({ name: 'Test Customer' });
      
      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test Customer');
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/customers')
        .send({ invalid: 'data' });
      
      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('BAD_REQUEST');
    });
  });

  describe('POST /usage', () => {
    it('should record usage for a customer', async () => {
      // First create a customer
      const customerResponse = await request(app)
        .post('/customers')
        .send({ name: 'Test Customer' });
      
      const customerId = customerResponse.body.data.id;

      // Then record usage
      const usageResponse = await request(app)
        .post('/usage')
        .send({
          customerId,
          service: 'Database Hosting',
          unitsConsumed: 100,
          pricePerUnit: 0.5
        });

      expect(usageResponse.status).toBe(201);
      expect(usageResponse.body.status).toBe('success');
      expect(usageResponse.body.data).toHaveProperty('id');
      expect(usageResponse.body.data.customerId).toBe(customerId);
    });

    it('should return 404 for non-existent customer', async () => {
      const response = await request(app)
        .post('/usage')
        .send({
          customerId: '123e4567-e89b-12d3-a456-426614174999',
          service: 'Database Hosting',
          unitsConsumed: 100,
          pricePerUnit: 0.5
        });

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid customer ID', async () => {
      const response = await request(app)
        .post('/usage')
        .send({
          customerId: 'invalid-customer-id',
          service: 'Database Hosting',
          unitsConsumed: 100,
          pricePerUnit: 0.5
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('BAD_REQUEST');
    });

    it('should return 400 for invalid inputs', async () => {
      const response = await request(app)
        .post('/usage')
        .send({
          customerId: 123560,
          service: ' !Database Hosting! ',
          unitsConsumed: -100, // Invalid: negative units
          pricePerUnit: '0.5'
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('BAD_REQUEST');
    });

    it('should return 409 for duplicate usage record', async () => {
      // First create a customer
      const customerResponse = await request(app)
        .post('/customers')
        .send({ name: 'Test Customer' });
      
      const customerId = customerResponse.body.data.id;

      // First request - should succeed
      const firstResponse = await request(app)
        .post('/usage')
        .send({
          customerId,
          service: 'Database Hosting',
          unitsConsumed: 100,
          pricePerUnit: 0.5,
          requestId: 'duplicate-request-id'
        });

      expect(firstResponse.status).toBe(201);

      // Second request with same requestId - should fail
      const secondResponse = await request(app)
        .post('/usage')
        .send({
          customerId,
          service: 'Database Hosting',
          unitsConsumed: 100,
          pricePerUnit: 0.5,
          requestId: 'duplicate-request-id'
        });

      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body.status).toBe('error');
      expect(secondResponse.body.error.code).toBe('DUPLICATE_RECORD');
    });
  });
});
