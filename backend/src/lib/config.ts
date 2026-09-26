import { z } from 'zod';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@127.0.0.1:5432/kisansetu?schema=public'),
  JWT_SECRET: z.string().default('kisansetu-super-secret-jwt-key-2024-dev-env-min-32-chars!'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000,http://localhost:80,http://localhost,http://127.0.0.1:5173'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DEMO_MODE: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'false' || val === '0') return false;
      if (val === 'true' || val === '1') return true;
      // Default: enabled in non-production, disabled in production
      return process.env.NODE_ENV !== 'production';
    }),
  LOG_LEVEL: z.string().default('info'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_AUTH: z.coerce.number().default(30), // Max auth requests per window
  RATE_LIMIT_MAX_GENERAL: z.coerce.number().default(600), // Max general requests per window
});

export type AppConfig = z.infer<typeof envSchema> & {
  parsedAllowedOrigins: string[];
};

/**
 * Validates runtime environment configuration.
 * Strictly enforces security constraints in production mode.
 */
export function loadAndValidateConfig(): AppConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    logger.fatal({ errors: result.error.format() }, 'Invalid environment configuration');
    throw new Error(`Configuration validation failed: ${JSON.stringify(result.error.format())}`);
  }

  const rawConfig = result.data;

  // Strict Production Validations
  if (rawConfig.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      const msg = 'FATAL: In production, JWT_SECRET must be explicitly set and be at least 32 characters long.';
      logger.fatal(msg);
      throw new Error(msg);
    }

    if (process.env.JWT_SECRET.includes('dev-env') || process.env.JWT_SECRET.includes('hackathon')) {
      const msg = 'FATAL: In production, JWT_SECRET cannot use default or development placeholder strings.';
      logger.fatal(msg);
      throw new Error(msg);
    }

    if (!process.env.DATABASE_URL) {
      const msg = 'FATAL: In production, DATABASE_URL must be explicitly configured.';
      logger.fatal(msg);
      throw new Error(msg);
    }
  }

  const parsedAllowedOrigins = rawConfig.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);

  return {
    ...rawConfig,
    parsedAllowedOrigins,
  };
}

export const config = loadAndValidateConfig();
export default config;
