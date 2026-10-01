import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { startLocalPostgresIfNeeded } from './dbServer';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/kisansetu?schema=public';

const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
const isProduction = process.env.NODE_ENV === 'production';
const isLocalPglite = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('127.0.0.1') || process.env.DATABASE_URL.includes('localhost');
const poolMax = process.env.DATABASE_MAX_POOL
  ? parseInt(process.env.DATABASE_MAX_POOL, 10)
  : (isTest || isLocalPglite ? 1 : 10);

const useSsl = process.env.DATABASE_SSL === 'true' || (isProduction && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));
const pool = new Pool({
  connectionString,
  max: poolMax,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (_err) => {
  // Prevent unhandled idle client errors from terminating runtime process
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

/**
 * Initializes the database connection and verifies schema status.
 * In development/test, provides automatic embedded schema bootstrap.
 * In production, strictly relies on formal Prisma migrations without unmanaged DDL mutations.
 */
export async function initializeDatabase(): Promise<void> {
  await startLocalPostgresIfNeeded();

  // Connect with retry to handle rapid process cold-start / socket synchronization
  let client: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      client = await pool.connect();
      break;
    } catch (err: any) {
      if (attempt === 3) throw err;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  try {
    // In production, execute a simple health ping; production schema is managed via `prisma migrate deploy`
    if (isProduction) {
      await client.query('SELECT 1;');

      // Only seed if explicitly enabled in production (e.g. initial staging/demo rollout)
      if (process.env.SEED_DEMO_DATA === 'true') {
        const countCheck = await client.query("SELECT to_regclass('public.users') as exists;");
        if (countCheck.rows[0]?.exists) {
          const userCount = await client.query('SELECT count(*)::int as count FROM users;');
          if (userCount.rows[0]?.count === 0) {
            const { seedBaseDataIfNotExists } = await import('../../prisma/seed');
            await seedBaseDataIfNotExists();
          }
        }
      }
      return;
    }

    // --- Development & Local Test Schema Bootstrap ---
    const tableCheck = await client.query(
      "SELECT to_regclass('public.users') as exists;"
    );
    if (!tableCheck.rows[0]?.exists) {
      const migrationFile = path.resolve(__dirname, '../../prisma/migrations/20260926000000_init/migration.sql');
      if (fs.existsSync(migrationFile)) {
        const ddl = fs.readFileSync(migrationFile, 'utf-8');
        await client.query(ddl);
      }
    }

    // Ensure isQueuePaused column exists on centres
    try {
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'centres' AND column_name = 'isQueuePaused';
      `);
      if (columnCheck.rows.length === 0) {
        await client.query('ALTER TABLE "centres" ADD COLUMN IF NOT EXISTS "isQueuePaused" BOOLEAN NOT NULL DEFAULT false;');
      }
    } catch {
      // Ignore if table doesn't exist yet
    }

    // Ensure Phase 28 provider & webhook columns and enum values exist on payments
    try {
      await client.query(`
        ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CREATED';
        ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REVERSED';
        ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "providerName" TEXT;
        ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "providerReference" TEXT;
        ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
        ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "webhookEventId" TEXT;
        ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "providerStatus" TEXT;
      `);
    } catch {
      // Ignore if payments table/type doesn't exist yet
    }

    // Check if database is empty - seed base records only if zero users exist in development/test
    try {
      const countCheck = await client.query('SELECT count(*)::int as count FROM users;');
      if (countCheck.rows[0]?.count === 0) {
        const { seedBaseDataIfNotExists } = await import('../../prisma/seed');
        await seedBaseDataIfNotExists();
      }
    } catch {
      // Ignore if database cannot be queried
    }
  } finally {
    if (client) client.release();
  }
}

export { pool };
export default prisma;
