import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default('5432'),
  DB_NAME: z.string().default('billing_system'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  API_BASE_URL: z.string().default('http://localhost:3000')
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Database configuration
const databaseConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD
};

// API configuration
const apiConfig = {
  baseUrl: env.API_BASE_URL
};

// Server configuration
const serverConfig = {
  port: env.PORT,
  env: env.NODE_ENV
};

// Export configuration
export const config = {
  database: databaseConfig,
  api: apiConfig,
  server: serverConfig
} as const;

// Type for the configuration
export type Config = typeof config;
