import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import 'express-async-errors';
import { v4 as uuidv4 } from 'uuid';

import { errorHandler } from './lib/errors.js';
import { logger } from './lib/logger.js';
import { prisma } from './db/client.js';
import { redis } from './redis/client.js';
import { openApiSpec } from './docs/spec.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import campaignRoutes from './routes/campaigns.routes.js';
import contactRoutes from './routes/contacts.routes.js';
import segmentRoutes from './routes/segments.routes.js';
import workspaceRoutes from './routes/workspaces.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import eventsRoutes from './routes/events.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import trackingRoutes from './routes/tracking.routes.js';
import webhookRoutes from './routes/webhooks.routes.js';
import billingRoutes, { stripeWebhookHandler } from './routes/billing.routes.js';
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
  // All /webhooks routes get raw body so signature verification works
  app.use('/webhooks', express.raw({ type: 'application/json' }));
  app.post('/webhooks/stripe', stripeWebhookHandler);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Liveness probe — always fast, no dependencies
  app.get('/health', (_req, res) => res.json({ ok: true, service: 'api' }));

  // Readiness probe — fails if DB or Redis is unreachable
  app.get('/ready', async (_req, res) => {
    const checks: Record<string, 'ok' | 'error'> = {};
    try { await prisma.$queryRaw`SELECT 1`; checks['db'] = 'ok'; } catch { checks['db'] = 'error'; }
    try { await redis.ping(); checks['redis'] = 'ok'; } catch { checks['redis'] = 'error'; }
    const healthy = Object.values(checks).every(v => v === 'ok');
    res.status(healthy ? 200 : 503).json({ ok: healthy, checks });
  });

  // API docs — Helmet CSP is relaxed for this path only
  app.use('/api-docs', helmet({ contentSecurityPolicy: false }), swaggerUi.serve, swaggerUi.setup(openApiSpec as never));

  // Public routes (tracking, webhooks) — no auth middleware
  app.use('/t', trackingRoutes);
  app.use('/webhooks', webhookRoutes);

  // Authenticated API routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', authenticate, tenant, userRoutes);
  app.use('/api/v1/workspaces', workspaceRoutes);
  app.use('/api/v1/campaigns', campaignRoutes);
  app.use('/api/v1/contacts', contactRoutes);
  app.use('/api/v1/segments', segmentRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/events', eventsRoutes);
  app.use('/api/v1/notifications', notificationsRoutes);
  app.use('/api/v1/billing', billingRoutes);

  // Global error handler — must be last
  app.use(errorHandler);

  return app;
}
