import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import { v4 as uuidv4 } from 'uuid';

import { errorHandler } from './lib/errors.js';
import { logger } from './lib/logger.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import campaignRoutes from './routes/campaigns.routes.js';
import contactRoutes from './routes/contacts.routes.js';
import segmentRoutes from './routes/segments.routes.js';
import trackingRoutes from './routes/tracking.routes.js';
import webhookRoutes from './routes/webhooks.routes.js';
import { authenticate } from './middleware/authenticate.js';
import { tenant } from './middleware/tenant.js';

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS — tighten origins in production
  app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173', credentials: true }));

  // Request-ID — threads through all logs for this request
  app.use((req, _res, next) => {
    req.headers['x-request-id'] ??= uuidv4();
    next();
  });

  // Request logging
  app.use((req, _res, next) => {
    logger.info({ method: req.method, url: req.url, requestId: req.headers['x-request-id'] }, 'incoming request');
    next();
  });

  // Body parsing — webhooks need raw body for signature verification
  app.use('/webhooks', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check (GCP Cloud Run liveness probe)
  app.get('/health', (_req, res) => res.json({ ok: true, service: 'api' }));

  // Public routes (tracking, webhooks) — no auth middleware
  app.use('/t', trackingRoutes);
  app.use('/webhooks', webhookRoutes);

  // Authenticated API routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', authenticate, tenant, userRoutes);
  app.use('/api/v1/campaigns', campaignRoutes);
  app.use('/api/v1/contacts', contactRoutes);
  app.use('/api/v1/segments', segmentRoutes);

  // Global error handler — must be last
  app.use(errorHandler);

  return app;
}
