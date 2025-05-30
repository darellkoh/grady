# TypeScript Client library for the Billing System API

A TypeScript client library for a billing system API for recording customer usage data with idempotency support.

## Features

- Record customer usage with automatic idempotency handling
- SHA-256 hash-based request deduplication
- Graceful handling of duplicate requests
- TypeScript support with full type definitions
- Type-safe request and response handling
- Full unit test suite
- A demo script showcasing client library usage and edge cases
- Environment-specific configuration management (development, staging, production)
- Centralized and standardized error and response handling

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Testing**:
  - Jest for unit testing
  - Supertest for API testing
- **Type Safety**:
  - [Zod](https://zod.dev/) for runtime type validation
  - TypeScript for static type checking
- **Development Tools**:
  - ESLint for code linting
  - Prettier for code formatting
  - dotenv for environment configuration
- **HTTP Client**: Axios with retry support
- **Error Handling**: Centralized custom error classes for different scenarios

## Prerequisites

- Node.js (v16 or higher)
- npm (v6 or higher)
- PostgreSQL database

## Installation

1. Clone the repository:
```bash
git clone https://github.com/darellkoh/interview-darellkoh-d2753f837c6f4ac7a2a9a3acadd7e343.git
cd interview-darellkoh-d2753f837c6f4ac7a2a9a3acadd7e343
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
# Create a .env file with your database configuration
cp .env.example .env
```

Edit `.env` with your database credentials:

For different environments, you can create:
- `.env` - Development environment (default)
- `.env.staging` - Staging environment
- `.env.production` - Production environment

The application will automatically load the correct environment file based on the NODE_ENV:
- `npm start` - Uses `.env` (development)
- `npm run start:staging` - Uses `.env.staging`
- `npm run start:prod` - Uses `.env.production`

4. Create the database and tables:
```bash
# Create the database
createdb billing_system

# Run the SQL script to create the tables
psql billing_system < src/db/init.sql
```

## Usage

### Starting the API Server

```bash
npm start
```

The server will start on port 3000.

## Local Development

1. Build the TypeScript code:
```bash
npm run build
```

2. Run linter:
```bash
npm run lint
```
3. Run formatter:
```bash
npm run format
```

### Building for Production

To build the client library for production use:

1. Build the TypeScript code with production optimizations:
```bash
npm run build:prod
```

This will:
- Clean the `dist` directory to ensure a fresh build
- Compile TypeScript to JavaScript with production optimizations:
  - Remove source maps for smaller bundle size
  - Remove comments and whitespace
  - Enable strict type checking
  - Target ES2018 for modern Node.js environments
  - Generate optimized type definitions
- Minify the JavaScript code using Terser:
  - Compress and mangle variable names
  - Remove dead code
  - Optimize for smaller bundle size
- Output the optimized build to the `dist` directory

2. The built files will be in the `dist` directory:
```
dist/
├── client/
│   └── BillingSystemClient.js     # Minified production-ready client library
├── types/
│   └── index.d.ts                 # TypeScript type definitions
└── index.js                       # Minified main entry point
```

3. To use the production build in another project:
   - Copy the `dist` directory to your project
   - Import the client:
   ```typescript
   import { BillingSystemClient } from './path/to/dist/client/BillingSystemClient';
   ```

### How to test the API

You can test the API using any HTTP client. Here are two commonly-used options:

1. **Postman**
   - Download from: https://www.postman.com/downloads/
   - Create a new POST request to `http://localhost:3000/usage`
   - Set Content-Type header to `application/json`
   - Add the request body in JSON format

2. **cURL** (CLI)
   ```bash
   # First, create a customer
   curl -X POST http://localhost:3000/customers \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Jane Doe"
     }'

   # Then, grab the customer ID of the newly-created customer and
   # insert it into the POST request below to record usage for the customer
   curl -X POST http://localhost:3000/usage \
     -H "Content-Type: application/json" \
     -d '{
       "customerId": <customer_id>,
       "service": "CDN Storage",
       "unitsConsumed": 15,
       "pricePerUnit": 0.02
     }'
   ```

### How to test the Client

There is a demo script in the repo (`src/demo.ts`) that is already configured to show a variety of client usage examples with logging for easy testing and debugging. This script can be modified and run locally. 

   ```bash
  npm run demo
   ```

## Testing

The project includes a comprehensive test suite using Jest and Supertest. Tests are organized by feature - API, client, database and utils.

### Running Tests

1. Run all tests:
```bash
npm test
```

2. Run tests in watch mode:
```bash
npm test -- --watch
```

3. Run tests with coverage:
```bash
npm test -- --coverage
```

### Using the Client Library

```typescript
import { BillingSystemClient } from './dist/client/BillingSystemClient';

const BASE_URL = "http://localhost:3000";
// Create a client instance
const client = new BillingSystemClient(BASE_URL);

// Record usage
const record = await client.recordUsage({
  customerId: "abc123",
  service: "CDN Storage",
  unitsConsumed: 15,
  pricePerUnit: 0.02
});

// Handle errors
try {
  await client.recordUsage({
    customerId: "abc123",
    service: "CDN Storage",
    unitsConsumed: 15,
    pricePerUnit: 0.02
  });
} catch (error) {
  if (error instanceof DuplicateRecordError) {
    console.log('Usage already recorded');
  } else if (error instanceof ValidationError) {
    console.log('Invalid input:', error.message);
  } else {
    console.log('Unexpected error:', error);
  }
}
```

## Project Structure

```
.
├── src/
│   ├── api/
│   │   └── server.ts           # Express server and route handlers
│   ├── client/
│   │   └── BillingSystemClient.ts  # Client library implementation
│   ├── config/
│   │   ├── config.ts           # Configuration management
│   │   └── database.ts         # Database connection setup
│   ├── db/
│   │   └── init.sql            # Database schema and sample data
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   ├── utils/
│   │   └── index.ts            # Utility functions
│   ├── demo.ts                 # Demo script for client usage
│   └── index.ts                # Main entry point
├── src/__tests__/
│   ├── api/
│   │   └── server.test.ts      # API endpoint tests
│   ├── client/
│   │   └── billingSystemClient.test.ts  # Client library tests
│   ├── db/
│   │   └── database.test.ts    # Database operation tests
│   └── utils.test.ts           # Utility function tests
├── dist/                       # Compiled JavaScript files
├── .env.example               # Example environment configuration
├── .eslintrc.js              # ESLint configuration
├── .prettierrc               # Prettier configuration
├── jest.config.js            # Jest configuration
├── package.json              # Project dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Project documentation
```

## Notes on Idempotency

The API automatically generates a deterministic SHA-256 hash-based request ID based on the request payload data (excluding timestamps). This way, the same usage data will always generate the same request ID no matter what.

The `/usage` POST endpoint is also designed to be naturally idempotent - sending the same request twice will not create duplicate records and will return a 409 CONFLICT error, indicating that the usage record already exists in the database.

## Troubleshooting

### Port Already in Use
If you see the error `Error: listen EADDRINUSE: address already in use :::3000`, it means port 3000 is already being used. To fix this:

1. Find the process using port 3000:
```bash
lsof -i :3000
```

2. Kill the process:
```bash
kill -9 <PID>
```

Or use this one-liner:
```bash
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Database Connection Issues
If you see database connection errors:

1. Make sure PostgreSQL is running:
```bash
pg_isready
```

2. Verify your database credentials in `.env` match your PostgreSQL setup
3. Ensure the database exists:
```bash
psql -l  # List all databases
```

4. If needed, recreate the database and tables:
```bash
dropdb billing_system
createdb billing_system
psql billing_system < src/db/init.sql
```

### Nice To-Haves

If I had more time or if this were a production-level system, I would add the following: 
 - An ORM so we don't have to write raw complex SQL. An example that is commonly-used with TS/Node projects is Prisma. 
 - User authentication and authorization for every service (client, API, db).
 - `updated_at` column for the `customers` table in case customers need to update their name.
 - Depending on the needs and scale of this billing system, possibly separate the API and client into separate services, especially if there are multiple client libraries. 
 - Use Protobufs for a standardized response and request data schema so we can easily compile and use the schema in different client libraries of various languages.
 - Write a build script that automatically builds, packages and uploads/publishes the client library to an package/artifact repo manager (eg: Artifactory, or NPM if it's public)
 - Potentially use GraphQL for the API for easier versioning, if real-time billing updates are needed or if type-safety is needed, if we need to query complex data efficiently and if there aren't any strong blockers to not use it.
 - Add a ton of monitoring, observability and alerting: event tracking, error reporting, structured logging, performance monitoring and profiling, business metrics tracking.
 - Add integration and smoke tests to run on a scheduled cadence, load testing if we need to test if it can handle a high volume of requests.
 - Rate limiting and DDoS prevention.
 - API documentation so the request/response format and contract is clear for users. Examples: OpenAPI, Swagger.
 - Add caching is there is frequently-accessed data.
 - Add a request queue if there are high-load scenarios.
 
 ...there are many, many more to name! But I guess we can save that for the technical deep-dive :) 
 