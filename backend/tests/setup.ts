import { initializeDatabase } from '../src/lib/prisma';
import { beforeAll, afterAll } from 'vitest';
import { pool } from '../src/lib/prisma';
import { stopLocalPostgres } from '../src/lib/dbServer';

beforeAll(async () => {
  try {
    await initializeDatabase();
  } catch (err) {
    // If running in isolated sandbox without local port permissions, fallback gracefully
  }
});

