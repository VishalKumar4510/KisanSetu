import { Router, Request, Response } from 'express';
import { pool, prisma } from '../lib/prisma';
import logger from '../lib/logger';

const router = Router();

/**
 * GET /health/live
 * Liveness probe: verifies process is alive and receiving HTTP traffic.
 * No authentication required.
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * GET /health/ready
 * Readiness probe: verifies essential dependencies (PostgreSQL) are operational.
 * Returns 200 if ready to serve traffic, 503 if dependencies are unreachable.
 * Never leaks database credentials, internal connection strings, or system paths.
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // 1. Verify PostgreSQL connectivity via pg pool
    const client = await pool.connect();
    try {
      await client.query('SELECT 1;');
    } finally {
      client.release();
    }

    return res.status(200).json({
      status: 'ready',
    });
  } catch (err: any) {
    logger.warn({ error: err?.message || 'Database ping failed' }, 'Readiness check failed: Database unreachable');
    return res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection unavailable',
    });
  }
});

export default router;
