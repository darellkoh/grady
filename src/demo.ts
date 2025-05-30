import { BillingSystemClient } from '@/client/billingSystemClient';

const BASE_URL = 'http://localhost:3000';
const client = new BillingSystemClient(BASE_URL);

async function runTests(): Promise<void> {
  try {
    // Create a test customer
    const customerResponse = await client.createCustomer({ name: 'Test Customer' });
    // eslint-disable-next-line no-console
    console.log('Created customer:', customerResponse);

    // Test Case 1: Usage record doesn't exist
    try {
      console.log('## Test Case 1: Usage record doesn\'t exist ##' );
      const usageResponse = await client.recordUsage({
        customerId: customerResponse.id,
        service: 'Database Hosting',
        unitsConsumed: 100,
        pricePerUnit: 0.5
      });
      // eslint-disable-next-line no-console
      console.log('Test passed:', usageResponse);
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.log('Test failed:', error instanceof Error ? error.message : String(error));
    }

    // Test Case 2: Duplicate usage record
    try {
      console.log('\n## Test Case 2: Usage record already exists ##');
      const usageResponse = await client.recordUsage({
        customerId: customerResponse.id,
        service: 'Database Hosting',
        unitsConsumed: 100,
        pricePerUnit: 0.5
      });
      // eslint-disable-next-line no-console
      console.log('Test failed:', usageResponse);
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.log('Test passed:', error instanceof Error ? error.message : String(error));
    }

    // Test Case 3: Invalid customer ID
    try {
      console.log('## Test Case 3: Invalid customer ID ##');
      const usageResponse = await client.recordUsage({
        customerId: 'invalid-customer-id',
        service: 'Database Hosting',
        unitsConsumed: 100,
        pricePerUnit: 0.5
      });
      // eslint-disable-next-line no-console
      console.log('Test failed:', usageResponse);
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.log('Test passed:', error instanceof Error ? error.message : String(error));
    }

    // Test Case 4: Invalid request inputs
    try {
      console.log('## Test Case 4: Invalid request inputs ##');
      const usageResponse = await client.recordUsage({
        customerId: customerResponse.id,
        service: 'Database Hosting',
        unitsConsumed: -100,
        pricePerUnit: -0.5
      });
      // eslint-disable-next-line no-console
      console.log('Test failed:', usageResponse);
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.log('Test passed:', error instanceof Error ? error.message : String(error));
    }
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error running tests:', error instanceof Error ? error.message : String(error));
  }
}

// Run the tests
void runTests();
