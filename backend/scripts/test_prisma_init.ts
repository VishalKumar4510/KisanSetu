import { initializeDatabase, prisma, pool } from '../src/lib/prisma';
import { stopLocalPostgres } from '../src/lib/dbServer';

async function main() {
  console.log('Testing initializeDatabase()...');
  await initializeDatabase();
  console.log('Database initialized successfully.');

  // Test simple count query
  const userCount = await prisma.user.count();
  console.log('User count in PostgreSQL:', userCount);

  await pool.end();
  await stopLocalPostgres();
  console.log('Prisma test completed successfully!');
}

main().catch(err => {
  console.error('Prisma initialization failed:', err);
  process.exit(1);
});
