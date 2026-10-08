import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file in non-production
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  BCRYPT_COST: z.coerce.number().min(4).max(20).default(12),
  TRUST_PROXY: z.string().default('0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().default(10),
  RATE_LIMIT_LOGIN_WINDOW_MIN: z.coerce.number().default(15),
  RATE_LIMIT_REGISTER_MAX: z.coerce.number().default(10),
  RATE_LIMIT_REGISTER_WINDOW_MIN: z.coerce.number().default(60),
});

// Fail fast if env is invalid
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = z.infer<typeof envSchema>;
