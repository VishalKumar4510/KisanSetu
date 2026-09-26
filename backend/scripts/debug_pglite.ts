import { PGlite } from '@electric-sql/pglite';
import path from 'path';

async function main() {
  const dataDir = path.resolve(__dirname, '../pgdata');
  console.log('Testing PGlite with dataDir:', dataDir);
  try {
    const db = await PGlite.create({
      dataDir,
      debug: 3,
    });
    console.log('PGlite created successfully!');
    const res = await db.query('SELECT 1 as num;');
    console.log('Query result:', res);
    await db.close();
  } catch (err: any) {
    console.error('PGlite error:', err);
  }
}

main();
