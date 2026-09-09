import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';

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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0', name: 'KisanSetu API' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/centres', centreRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/ai', aiRoutes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║       🌾 KisanSetu API Server 🌾         ║
  ║                                           ║
  ║   Running on http://localhost:${PORT}        ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}            ║
  ║                                           ║
  ║   Demo credentials:                       ║
  ║   Farmer:  farmer1 / farmer1              ║
  ║   Officer: officer1 / officer1            ║
  ║   Admin:   admin1 / admin1                ║
  ╚═══════════════════════════════════════════╝
  `);
});

export default app;
