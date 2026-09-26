import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { startLocalPostgresIfNeeded } from './dbServer';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/kisansetu?schema=public';

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
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
 * Initializes the database connection and applies initial migration DDL if necessary.
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
  } finally {
    if (client) client.release();
  }
}

export { pool };
export default prisma;
