import express, { Request, Response, NextFunction } from 'express';
import { Database } from '@/db/database';
import { AppError } from '@/errors/appError';
import { 
  ValidationError,
  NotFoundError,
  InternalServerError
} from '@/errors/httpErrors';
import { generateRequestId, toServiceCode } from '@/utils';
import { createCustomerType, customerResponseType } from '@/types/customer';
import { 
  createUsageRecordType,
  usageRecordResponseType,
} from '@/types/usage';
import { ApiResponse } from './response';
import { ZodError } from 'zod';

export const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.post('/customers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createCustomerType.parse(req.body);
    const customer = await Database.createCustomer(validatedData);
    const validatedResponse = customerResponseType.parse(customer);
    ApiResponse.created(validatedResponse).send(res);
  } catch (error) {
    next(error);
  }
});

app.post('/usage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createUsageRecordType.parse(req.body);
    const { customerId, service, unitsConsumed, pricePerUnit } = validatedData;

    // Check if customer exists
    const customer = await Database.getCustomer(customerId);
    if (!customer) {
      throw new NotFoundError(`Customer with ID ${customerId} does not exist`);
    }

    // Convert service to service code to avoid whitespace
    // consistency issues with hashing
    // (eg: "Database hosting" -> "DATABASE_HOSTING")
    const serviceCode = toServiceCode(service);

    // Generate request ID for idempotency
    const requestId = generateRequestId({
      customerId,
      service,
      serviceCode,
      unitsConsumed,
      pricePerUnit
    });

    // Create usage record
    const usageRecord = await Database.createUsageRecord({
      customerId,
      service,
      unitsConsumed,
      pricePerUnit,
      requestId,
      serviceCode
    });

    const validatedResponse = usageRecordResponseType.parse(usageRecord);
    ApiResponse.created(validatedResponse).send(res);
  } catch (error) {
    next(error);
  }
});

app.get('/', (_req: Request, res: Response) => {
  ApiResponse.success({ message: 'Billing System API is working!' }).send(res);
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationError = new ValidationError('Invalid request data', {
      details: err.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
    return ApiResponse.error(validationError, res);
  }

  // Handle known application errors
  if (err instanceof AppError) {
    return ApiResponse.error(err, res);
  }

  // Handle unexpected errors
  const serverError = new InternalServerError('An unexpected error occurred');
  return ApiResponse.error(serverError, res);
});

// Server startup
export function startServer(): void {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.warn(`Billing System API is running on port ${port}`);
  });
}

// Only start the server if file is run directly
if (require.main === module) {
  startServer();
}
