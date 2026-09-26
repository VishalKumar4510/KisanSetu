import { execSync } from 'child_process';
import path from 'path';

async function run() {
  console.log('========================================================');
  console.log('🔄 KisanSetu Phase 18: Process Restart Persistence Test');
  console.log('========================================================');

  const step1Script = path.resolve(__dirname, 'persistence_step1_write.ts');
  const step2Script = path.resolve(__dirname, 'persistence_step2_read.ts');

  console.log('Stage 1: Launching Process #1 to Seed and Write Record...');
  const output1 = execSync(
    `npx ts-node -r tsconfig-paths/register "${step1Script}"`,
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf-8' }
  );
  console.log(output1.trim());

  console.log('\nStage 2: Process #1 Terminated. Simulating Server Restart (1.5s delay)...');
  await new Promise(r => setTimeout(r, 1500));

  console.log('Stage 3: Launching Process #2 to Query Persisted State from Cold Start...');
  const output2 = execSync(
    `npx ts-node -r tsconfig-paths/register "${step2Script}"`,
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf-8' }
  );
  console.log(output2.trim());

  console.log('========================================================');
  console.log('🎉 PROCESS RESTART PERSISTENCE VERIFIED 100% SUCCESS!');
  console.log('========================================================');
}

run().catch(err => {
  console.error('❌ Restart test failed:', err);
  process.exit(1);
});
