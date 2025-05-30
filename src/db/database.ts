import { Pool } from 'pg';
import { config } from '@/config/config';
import { Customer, CreateCustomerInput } from '@/types/customer';
import { UsageRecord, CreateUsageRecordRequest } from '@/types/usage';
import { DatabaseError, DuplicateRecordError } from '@/errors/databaseErrors';

interface PostgresError extends Error {
  code?: string;
}

/**
 * Database class for handling all database operations
 * Uses a connection pool for efficient database connections
 */
export class Database {
  private static pool: Pool = new Pool(config.database);

  /**
   * Creates a new customer in the database
   * @param input - Customer creation data
   * @returns The created customer with timestamps
   * @throws {DatabaseError} If database operation fails
   */
  static async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    try {
      const result = await this.pool.query(
        `INSERT INTO customers (name) VALUES ($1) RETURNING *`,
        [input.name]
      );
      const newCustomer = result.rows[0];
      return {
        id: newCustomer.id,
        name: newCustomer.name,
        createdAt: newCustomer.created_at.toISOString(),
        updatedAt: newCustomer.updated_at.toISOString()
      };
    } catch (error) {
      throw new DatabaseError('Failed to create customer', { error });
    }
  }

  /**
   * Retrieves a customer by their ID
   * @param id - Customer ID to look up
   * @returns Customer object if found, null if not found
   * @throws {DatabaseError} If database operation fails
   */
  static async getCustomer(id: string): Promise<Customer | null> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM customers WHERE id = $1',
        [id]
      );
      if (result.rows.length === 0) {
        return null;
      }
      const customer = result.rows[0];
      return {
        id: customer.id,
        name: customer.name,
        createdAt: customer.created_at.toISOString(),
        updatedAt: customer.updated_at.toISOString()
      };
    } catch (error) {
      throw new DatabaseError('Failed to get customer', { error });
    }
  }

  /**
   * Records usage for a customer
   * @param record - Usage record data including request ID and service code
   * @returns The created usage record
   * @throws {DuplicateRecordError} If a record with the same request ID exists
   * @throws {DatabaseError} If database operation fails
   */
  static async createUsageRecord(record: CreateUsageRecordRequest): Promise<UsageRecord> {
    try {
      const query = `
        INSERT INTO usage_records 
        (
          customer_id,
          service,
          service_code,
          units_consumed,
          price_per_unit,
          request_id
        ) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *
      `;
      const result = await this.pool.query(query, [
        record.customerId,
        record.service,
        record.serviceCode,
        record.unitsConsumed,
        record.pricePerUnit,
        record.requestId
      ]);
      const newRecord = result.rows[0];
      return {
        id: newRecord.id,
        customerId: newRecord.customer_id,
        service: newRecord.service,
        serviceCode: newRecord.service_code,
        unitsConsumed: newRecord.units_consumed,
        pricePerUnit: Number(newRecord.price_per_unit),
        requestId: newRecord.request_id,
        createdAt: newRecord.created_at.toISOString()
      };
    } catch (error) {
      const pgError = error as PostgresError;
      if (pgError.code === '23505') { // unique_violation
        throw new DuplicateRecordError('Usage record already exists', {
          requestId: record.requestId
        });
      }
      throw new DatabaseError('Failed to create usage record', { error });
    }
  }
}
