import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { errorHandler } from './middleware/errorHandler';
import { initializeDatabase, pool } from './lib/prisma';
import { stopLocalPostgres } from './lib/dbServer';
import config from './lib/config';
import logger from './lib/logger';
import { requestIdMiddleware, httpLogger } from './middleware/requestLogger';
import { authRateLimiter, generalRateLimiter } from './middleware/rateLimiter';

import authRoutes from './routes/auth';
import farmerRoutes from './routes/farmers';
import centreRoutes from './routes/centres';
import slotRoutes from './routes/slots';
import queueRoutes from './routes/queue';
import procurementRoutes from './routes/procurement';
import paymentRoutes from './routes/payments';
import notificationRoutes from './routes/notifications';
import analyticsRoutes from './routes/analytics';
import demoRoutes from './routes/demo';
import aiRoutes from './routes/ai';
import officerRoutes from './routes/officer';
import healthRoutes from './routes/health';

const app = express();
const PORT = config.PORT;

// 1. Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // API serves JSON; CSP is enforced on web-server frontend
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// 2. Request Correlation & Structured Logging
app.use(requestIdMiddleware);
app.use(httpLogger);

// 3. CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        config.parsedAllowedOrigins.includes(origin) ||
        (config.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// 4. Rate Limiting for Abuse Prevention
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api', generalRateLimiter);

// 5. Health Probes
app.use('/health', healthRoutes);
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    name: 'KisanSetu API',
  });
});

// 6. Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/centres', centreRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/officer', officerRoutes);

// 7. Demo Mode Isolation
if (config.DEMO_MODE) {
  app.use('/api/demo', demoRoutes);
} else {
  app.use('/api/demo', (_req, res) => {
    res.status(403).json({
      success: false,
      error: 'Demo endpoints and automated presentation workflows are disabled in production mode.',
    });
  });
}

// 8. Global Error Handler
app.use(errorHandler);

// 9. Server Lifecycle & Graceful Shutdown
let server: http.Server | null = null;

export async function shutdownGracefully(signal: string): Promise<void> {
  logger.info({ signal }, `Received ${signal}. Initiating graceful shutdown...`);

  if (server) {
    await new Promise<void>((resolve) => {
      server!.close(() => {
        logger.info('HTTP server stopped accepting new incoming requests.');
        resolve();
      });
    });
  }

  try {
    logger.info('Draining database connection pool...');
    await pool.end();
    logger.info('Database connection pool successfully drained.');
  } catch (err: any) {
    logger.error({ error: err.message }, 'Error closing database pool during shutdown');
  }

  try {
    await stopLocalPostgres();
  } catch {
    // Ignore local server stop errors
  }

  logger.info('Graceful shutdown completed.');
}

// Register process signal handlers in non-test execution
if (config.NODE_ENV !== 'test') {
  process.on('SIGTERM', () => {
    shutdownGracefully('SIGTERM').then(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    shutdownGracefully('SIGINT').then(() => process.exit(0));
  });

  initializeDatabase()
    .catch((err) => {
      logger.warn({ error: err.message }, 'Database initialization warning on startup');
    })
    .finally(() => {
      server = app.listen(PORT, () => {
        logger.info(
          {
            port: PORT,
            environment: config.NODE_ENV,
            demoMode: config.DEMO_MODE,
          },
          `🌾 KisanSetu API Server running on port ${PORT}`
        );
      });
    });
}

export { app, server };
export default app;
