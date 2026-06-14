import { Router, type Request, type Response } from 'express';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';
import { processBrevoWebhook } from '../services/events.service.js';

const router = Router();

/** POST /webhooks/brevo — delivery event stream */
router.post('/brevo', async (req: Request, res: Response) => {
  if (!verifySignature(req)) {
    logger.warn('Brevo webhook signature mismatch');
    res.status(401).send();
    return;
  }

  const body = req.body instanceof Buffer ? JSON.parse(req.body.toString()) : req.body;
  const events = Array.isArray(body) ? body : [body];

  // Return 200 immediately — process async to avoid Brevo timeouts
  res.status(200).send();

  processBrevoWebhook(events as Array<Record<string, unknown>>).catch((err) =>
    logger.error({ err }, 'Webhook processing error'),
  );
});

function verifySignature(req: Request): boolean {
  if (env.NODE_ENV === 'development') return true;

  // Brevo allows configuring a secret token sent as a custom header
  const secret = req.headers['x-brevo-webhook-secret'] as string | undefined;
  return secret === env.BREVO_WEBHOOK_SECRET;
}

export default router;
