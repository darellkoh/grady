import { toServiceCode, generateRequestId, formatCurrency } from '../utils';

describe('toServiceCode', () => {
  it('should convert a service name to a service code', () => {
    expect(toServiceCode('Database Hosting')).toBe('DATABASE_HOSTING');
    expect(toServiceCode('API Gateway')).toBe('API_GATEWAY');
    expect(toServiceCode('Cloud Storage')).toBe('CLOUD_STORAGE');
  });

  it('should handle empty input', () => {
    expect(toServiceCode('')).toBe('');
  });

  it('should handle whitesace characters', () => {
    expect(toServiceCode(' Database Hosting ')).toBe('DATABASE_HOSTING');
  });

  it('should handle special characters', () => {
    expect(toServiceCode('Database Hosting!')).toBe('DATABASE_HOSTING');
  });
});

describe('generateRequestId', () => {
  it('should generate a deterministic request ID', () => {
    const params = {
      customerId: '123',
      service: 'Database Hosting',
      serviceCode: 'DATABASE_HOSTING',
      unitsConsumed: 100,
      pricePerUnit: 0.5
    };
    const requestId = generateRequestId(params);
    expect(requestId).toBeDefined();
    expect(requestId).toHaveLength(64); // SHA-256 hash length
  });

  it('should generate different IDs for different inputs', () => {
    const params1 = {
      customerId: '123',
      service: 'Database Hosting',
      serviceCode: 'DATABASE_HOSTING',
      unitsConsumed: 100,
      pricePerUnit: 0.5
    };
    const params2 = {
      customerId: '456',
      service: 'API Gateway',
      serviceCode: 'API_GATEWAY',
      unitsConsumed: 200,
      pricePerUnit: 1.0
    };
    const requestId1 = generateRequestId(params1);
    const requestId2 = generateRequestId(params2);
    expect(requestId1).not.toBe(requestId2);
  });

  it('should handle zero values', () => {
    const params = {
      customerId: '123',
      service: 'Database Hosting',
      serviceCode: 'DATABASE_HOSTING',
      unitsConsumed: 0,
      pricePerUnit: 0
    };
    const requestId = generateRequestId(params);
    expect(requestId).toBeDefined();
    expect(requestId).toHaveLength(64);
  });
});
