const { PGlite } = require('@electric-sql/pglite');
const { PGLiteSocketServer } = require('@electric-sql/pglite-socket');
const path = require('path');
const fs = require('fs');

(async () => {
  try {
    const dataDir = path.join(__dirname, '..', 'pgdata');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    console.log('Initializing PGlite with directory:', dataDir);
    const db = await PGlite.create({ dataDir });
    console.log('PGlite instance created.');

    const server = new PGLiteSocketServer({
      db,
      port: 5432,
      host: '127.0.0.1',
    });

    await server.start();
    console.log('PostgreSQL TCP Server successfully listening on 127.0.0.1:5432!');
    
    // Quick test query via pg
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/kisansetu',
    });
    const res = await pool.query('SELECT 1 + 1 AS solution;');
    console.log('Query result via pg.Pool:', res.rows[0]);
    await pool.end();

    await server.stop();
    console.log('Server stopped cleanly.');
  } catch (err) {
    console.error('Error during test:', err);
  }
})();
