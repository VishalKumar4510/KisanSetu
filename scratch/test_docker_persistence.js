const path = require('path');
const { Client } = require(path.resolve(__dirname, '../backend/node_modules/pg'));

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/kisansetu?schema=public';

async function step1_write() {
  const client = new Client({ connectionString });
  await client.connect();

  const testId = 'audit-persist-docker-test-001';
  console.log(`[Persistence Step 1] Inserting unique verification record: ${testId}...`);

  await client.query(`
    INSERT INTO audit_logs (id, "userId", action, entity, "entityId", details, timestamp)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id) DO UPDATE SET details = $6;
  `, [
    testId,
    'user-admin-001',
    'DOCKER_PERSISTENCE_TEST',
    'ContainerVolume',
    'vol-sih-pgdata',
    'Verified persistence across container restart and compose down',
    new Date(),
  ]);

  const res = await client.query('SELECT * FROM audit_logs WHERE id = $1;', [testId]);
  await client.end();

  if (res.rows.length === 1 && res.rows[0].id === testId) {
    console.log(`✅ [Persistence Step 1] Record successfully written and confirmed in PostgreSQL.`);
    return true;
  }
  throw new Error('Failed to confirm written record');
}

async function step2_verify(label) {
  const client = new Client({ connectionString });
  await client.connect();

  const testId = 'audit-persist-docker-test-001';
  const res = await client.query('SELECT * FROM audit_logs WHERE id = $1;', [testId]);
  await client.end();

  if (res.rows.length === 1 && res.rows[0].id === testId) {
    console.log(`✅ [${label}] Confirmed: Record ${testId} SURVIVED with details: "${res.rows[0].details}".`);
    return true;
  }
  throw new Error(`Record ${testId} was NOT found after ${label}!`);
}

const command = process.argv[2];
if (command === 'write') {
  step1_write().catch(err => { console.error(err); process.exit(1); });
} else if (command === 'verify') {
  step2_verify(process.argv[3] || 'Verification').catch(err => { console.error(err); process.exit(1); });
}
