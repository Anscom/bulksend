import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { tenant } from '../middleware/tenant.js';
import { logger } from '../lib/logger.js';
import * as billingSvc from '../services/billing.service.js';

const router = Router();

/** POST /api/v1/billing/checkout — create a Stripe checkout session */
router.post('/checkout', authenticate, tenant, async (req: Request, res: Response) => {
  const { url } = await billingSvc.createCheckoutSession(req.user!.workspaceId, req.user!.email);
  res.json({ ok: true, data: { url } });
});

/** POST /api/v1/billing/verify — verify a Stripe checkout session and upgrade plan immediately */
router.post('/verify', authenticate, tenant, async (req: Request, res: Response) => {
  const { sessionId } = req.body as { sessionId?: string };
  if (!sessionId) { res.status(400).json({ ok: false, error: { code: 'BAD_REQUEST', message: 'sessionId required' } }); return; }
  const result = await billingSvc.verifyCheckoutSession(sessionId, req.user!.workspaceId);
  res.json({ ok: true, data: result });
});

/** POST /api/v1/billing/portal — create a Stripe billing portal session */
router.post('/portal', authenticate, tenant, async (req: Request, res: Response) => {
  const { url } = await billingSvc.createPortalSession(req.user!.workspaceId);
  res.json({ ok: true, data: { url } });
});

/** POST /webhooks/stripe — Stripe event stream (raw body, no auth) */
export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string | undefined;
  if (!sig) {
    res.status(400).send('Missing stripe-signature header');
    return;
  }

  const rawBody = req.body as Buffer;

  try {
    await billingSvc.handleStripeWebhook(rawBody, sig);
    res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err }, 'Stripe webhook error');
    res.status(400).send('Webhook error');
  }
}

export default router;
