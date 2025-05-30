import { z } from 'zod';

// Base types
export const usageRecordType = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  service: z.string().min(1).max(255),
  serviceCode: z.string().min(1).max(255),
  unitsConsumed: z.number().int().positive(),
  pricePerUnit: z.number().positive(),
  requestId: z.string(),
  createdAt: z.string().datetime()
});

export const createUsageRecordType = z.object({
  customerId: z.string().uuid(),
  service: z.string().min(1).max(255),
  unitsConsumed: z.number().int().positive(),
  pricePerUnit: z.number().positive(),
});

// Types derived from Zod types
export type UsageRecord = z.infer<typeof usageRecordType>;
export type CreateUsageRecordInput = z.infer<typeof createUsageRecordType>;
export type CreateUsageRecordRequest = CreateUsageRecordInput & {
  requestId: string;
  serviceCode: string;
};

// Response types
export const usageRecordResponseType = usageRecordType;
export const createUsageRecordResponseType = usageRecordType;
