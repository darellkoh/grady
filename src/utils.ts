import crypto from 'crypto';
import { CreateUsageRecordInput } from '@/types/usage';

export interface RequestIdParams extends CreateUsageRecordInput {
  serviceCode: string;
}

/**
 * Converts a service name to a service code
 * @param service The user-friendly service name to convert (eg "Database Hosting")
 * @returns The standardized service code (eg "DATABASE_HOSTING")
 */
export function toServiceCode(service: string): string {
  if (!service) return '';
  
  const nonAlphanumeric = /[^a-z0-9]/gi;  // Make regex case-insensitive
  const multipleUnderscores = /_+/g;
  const leadingTrailingUnderscores = /^_|_$/g;

  return service
    .toUpperCase()
    .replace(nonAlphanumeric, '_')
    .replace(multipleUnderscores, '_')
    .replace(leadingTrailingUnderscores, '');
}

/**
 * Generates a deterministic request ID based on usage data.
 * Excludes timestamp to avoid generating non-deterministic request IDs.
 * @param params - The parameters used to generate the request ID
 * @returns A SHA-256 hash of the concatenated parameters
 */
export function generateRequestId(params: RequestIdParams): string {
  const { customerId, service, serviceCode, unitsConsumed, pricePerUnit } = params;
  const data = `${customerId}:${service}:${serviceCode}:` +
    `${unitsConsumed}:${pricePerUnit}`;
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
