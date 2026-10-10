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
import swaggerRouter from './docs/swagger';

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
      const isAllowed =
        config.parsedAllowedOrigins.includes('*') ||
        config.parsedAllowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        (config.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin));

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// 4. Rate Limiting for Abuse Prevention
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api', generalRateLimiter);

// 5. Health Probes & Root Landing Page
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KisanSetu API — Operational</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #091e14 0%, #0d2818 50%, #163824 100%);
      color: #f0fdf4;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: rgba(16, 44, 28, 0.75);
      border: 1px solid rgba(74, 222, 128, 0.25);
      backdrop-filter: blur(16px);
      border-radius: 20px;
      padding: 44px;
      max-width: 580px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(34, 197, 94, 0.12);
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.4);
      color: #4ade80;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 24px;
    }
    .pulse {
      width: 8px;
      height: 8px;
      background-color: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
      100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
    }
    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }
    p {
      color: #86efac;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 32px;
      opacity: 0.9;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 32px;
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 13px 18px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: #16a34a;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);
    }
    .btn-primary:hover {
      background: #15803d;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(22, 163, 74, 0.5);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #dcfce7;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.14);
      transform: translateY(-2px);
      color: #ffffff;
    }
    .footer {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 20px;
      font-size: 13px;
      color: #6ee7b7;
      opacity: 0.75;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="pulse"></span>
      API LIVE & OPERATIONAL
    </div>
    <h1>🌾 KisanSetu API</h1>
    <p>National Agri-Procurement & Direct Benefit Transfer Backend Gateway is healthy and ready to serve requests.</p>
    
    <div class="grid">
      <a href="/api/docs" class="btn btn-primary">📖 Swagger Docs</a>
      <a href="/health/ready" class="btn btn-secondary">🏥 Readiness Probe</a>
      <a href="/api/centres" class="btn btn-secondary">🏛️ Mandi Centres</a>
      <a href="/api/health" class="btn btn-secondary">⚡ Health Status</a>
    </div>

    <div class="footer">
      Node.js · PostgreSQL · Prisma ORM · Express 4
    </div>
  </div>
</body>
</html>`);
  }

  res.json({
    status: 'ok',
    name: 'KisanSetu API Server',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health/ready',
  });
});

app.use('/health', healthRoutes);
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    name: 'KisanSetu API',
  });
});

// 6. Interactive API Documentation (OpenAPI 3.0 & Swagger UI)
app.use('/api/docs', swaggerRouter);

// 7. Application Routes
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
