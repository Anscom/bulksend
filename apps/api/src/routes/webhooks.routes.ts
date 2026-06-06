import { Router, type Request, type Response } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';
import { processSendGridWebhook } from '../services/events.service.js';

// Public route — authenticated by Ed25519 / HMAC signature from SendGrid.
const router = Router();

/** POST /webhooks/sendgrid — delivery event stream */
router.post('/sendgrid', async (req: Request, res: Response) => {
  if (!verifySignature(req)) {
    logger.warn('SendGrid webhook signature mismatch');
    res.status(401).send();
    return;
  }

  const events = Array.isArray(req.body) ? req.body : [req.body];

  // Return 200 immediately — process async to avoid SendGrid timeouts
  res.status(200).send();

  processSendGridWebhook(events as Array<Record<string, unknown>>).catch((err) =>
    logger.error({ err }, 'Webhook processing error'),
  );
});

function verifySignature(req: Request): boolean {
  if (env.NODE_ENV === 'development') return true;

  const signature = req.headers['x-twilio-email-event-webhook-signature'] as string;
  const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'] as string;
  if (!signature || !timestamp) return false;

  const payload = timestamp + JSON.stringify(req.body);
  const expected = createHmac('sha256', env.SENDGRID_WEBHOOK_SECRET)
    .update(payload)
    .digest('base64');

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export default router;
