import { initializeDatabase, prisma, pool } from '../src/lib/prisma';
import { stopLocalPostgres } from '../src/lib/dbServer';

async function main() {
  await initializeDatabase();

  const testProcId = 'proc-persist-999';
  const testTokenNum = 'TKN-PERSIST-999';

  const persistedProc = await prisma.procurement.findUnique({
    where: { id: testProcId },
    include: { token: true },
  });

  if (!persistedProc) {
    throw new Error(`CRITICAL: Procurement ${testProcId} was lost across process restart!`);
  }
  if (persistedProc.token.tokenNumber !== testTokenNum) {
    throw new Error(`Token mismatch: expected ${testTokenNum}, got ${persistedProc.token.tokenNumber}`);
  }
  if (persistedProc.status !== 'WEIGHING') {
    throw new Error(`Status mismatch: expected WEIGHING, got ${persistedProc.status}`);
  }
  if (persistedProc.calculatedNetAmount !== 151116) {
    throw new Error(`Net amount mismatch: expected 151116, got ${persistedProc.calculatedNetAmount}`);
  }

  console.log(`[Process 2] Cold start query confirmed: Procurement ${testProcId} survived restart with Status: ${persistedProc.status} and Amount: ₹${persistedProc.calculatedNetAmount.toLocaleString('en-IN')}`);
  await pool.end();
  await stopLocalPostgres();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('[Process 2] Failed:', err);
  await pool.end();
  await stopLocalPostgres();
  process.exit(1);
});
