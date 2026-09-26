import { initializeDatabase, prisma, pool } from '../src/lib/prisma';
import { stopLocalPostgres } from '../src/lib/dbServer';
import { seedDatabase } from '../prisma/seed';

async function main() {
  await seedDatabase();

  const testProcId = 'proc-persist-999';
  const testTokenNum = 'TKN-PERSIST-999';
  const testFarmerId = 'farmer-0001';
  const testCentreId = 'centre-001';
  const testSlot = await prisma.slot.findFirst({ where: { centreId: testCentreId } });
  const testProduce = await prisma.produce.findFirst({ where: { farmerId: testFarmerId } });

  const createdToken = await prisma.token.create({
    data: {
      id: 'token-persist-999',
      farmerId: testFarmerId,
      slotId: testSlot!.id,
      centreId: testCentreId,
      tokenNumber: testTokenNum,
      qrData: JSON.stringify({ tokenNumber: testTokenNum }),
      status: 'ACTIVE',
      queuePosition: 42,
      estimatedTime: '25 mins',
    },
  });

  const createdProc = await prisma.procurement.create({
    data: {
      id: testProcId,
      farmerId: testFarmerId,
      centreId: testCentreId,
      tokenId: createdToken.id,
      produceId: testProduce!.id,
      status: 'WEIGHING',
      calculatedGrossAmount: 154200,
      calculatedNetAmount: 151116,
      timeline: [
        {
          stage: 'WEIGHING',
          label: 'Weighment in progress before restart',
          timestamp: new Date().toISOString(),
          actor: 'Weighbridge Operator',
        },
      ],
    },
  });

  console.log(`[Process 1] Successfully wrote Token ${testTokenNum} and Procurement ${testProcId} (Status: ${createdProc.status}) to PostgreSQL.`);
  await pool.end();
  await stopLocalPostgres();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('[Process 1] Failed:', err);
  await pool.end();
  await stopLocalPostgres();
  process.exit(1);
});
