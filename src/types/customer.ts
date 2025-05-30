import { z } from 'zod';

// Base types
export const customerType = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const createCustomerType = z.object({
  name: z.string().min(1).max(255)
});

// Types derived from Zod types
export type Customer = z.infer<typeof customerType>;
export type CreateCustomerInput = z.infer<typeof createCustomerType>;

// Response types
export const customerResponseType = customerType;
export const createCustomerResponseType = customerType;
