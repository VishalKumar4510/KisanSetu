import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import path from 'path';
import fs from 'fs';
import net from 'net';

let socketServer: any = null;
let startingPromise: Promise<void> | null = null;

export async function isPortInUse(port: number = 5432, host: string = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(400);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

export async function startLocalPostgresIfNeeded(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL || '';
  // If user configured a remote host, do not start local server
  if (dbUrl && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) {
    return;
  }

  if (socketServer) return;
  if (startingPromise) return startingPromise;

  startingPromise = (async () => {
    const inUse = await isPortInUse(5432, '127.0.0.1');
    if (inUse) {
      return; // Already listening (external postgres or previous background task)
    }

    const dataDir = path.resolve(__dirname, '../../pgdata');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    } else {
      // If port 5432 is not in use, remove any stale postmaster.pid left by a crashed/aborted process
      const pidFile = path.join(dataDir, 'postmaster.pid');
      if (fs.existsSync(pidFile)) {
        try {
          fs.unlinkSync(pidFile);
        } catch {
          // ignore
        }
      }
    }

    let db: any;
    try {
      db = await PGlite.create({ dataDir });
    } catch (err: any) {
      console.warn('Postgres recovery failed, re-initializing clean database directory...');
      try {
        fs.rmSync(dataDir, { recursive: true, force: true });
        fs.mkdirSync(dataDir, { recursive: true });
        db = await PGlite.create({ dataDir });
      } catch (retryErr) {
        throw retryErr;
      }
    }
    socketServer = new PGLiteSocketServer({
      db,
      port: 5432,
      host: '127.0.0.1',
    });

    await socketServer.start();
  })();

  await startingPromise;
  startingPromise = null;
}

export async function stopLocalPostgres(): Promise<void> {
  if (socketServer) {
    try {
      await socketServer.stop();
    } catch {
      // ignore
    }
    socketServer = null;
  }
}
