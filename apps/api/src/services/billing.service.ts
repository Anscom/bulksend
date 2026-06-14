import Stripe from 'stripe';
import { prisma } from '../db/client.js';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';
import { Errors } from '../lib/errors.js';

// Lazy Stripe client — initialized on first use so missing key doesn't crash startup
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw Errors.unprocessable('Stripe is not configured (missing STRIPE_SECRET_KEY)');
  if (!_stripe) _stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-05-27.dahlia' });
  return _stripe;
}

const PLAN_RATES: Record<string, boolean> = {
  active: true,
  trialing: true,
};

export async function createCheckoutSession(workspaceId: string, userEmail: string) {
  if (!env.STRIPE_PRO_PRICE_ID) throw Errors.unprocessable('Stripe price not configured (missing STRIPE_PRO_PRICE_ID)');

  const stripe = getStripe();
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });

  if (workspace.plan === 'pro') throw Errors.conflict('Already on Pro plan');

  // Create or reuse Stripe customer
  let customerId = workspace.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { workspaceId },
    });
    customerId = customer.id;
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
    // {CHECKOUT_SESSION_ID} is a Stripe template variable — it injects the real session ID at redirect time
    success_url: `${env.APP_URL}/upgrade?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.APP_URL}/upgrade?canceled=true`,
    subscription_data: { metadata: { workspaceId } },
    allow_promotion_codes: true,
  });

  return { url: session.url! };
}

export async function verifyCheckoutSession(sessionId: string, workspaceId: string) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });

  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    throw Errors.unprocessable('Payment not completed');
  }

  const sub = session.subscription as Stripe.Subscription | null;
  if (!sub) throw Errors.unprocessable('No subscription found on session');

  // Ensure this session belongs to this workspace's customer
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  if (workspace.stripeCustomerId && workspace.stripeCustomerId !== session.customer) {
    throw Errors.forbidden();
  }

  await activatePro(workspaceId, sub.id);
  return { plan: 'pro' };
}

export async function createPortalSession(workspaceId: string) {
  const stripe = getStripe();
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });

  if (!workspace.stripeCustomerId) throw Errors.unprocessable('No billing account found');

  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: `${env.APP_URL}/upgrade`,
  });

  return { url: session.url };
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  const stripe = getStripe();
  let event: Stripe.Event;

  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    if (env.NODE_ENV !== 'development') throw Errors.unauthorized();
    // Dev-only: no secret configured — parse body directly (use `stripe listen` for local testing)
    event = JSON.parse(rawBody.toString()) as Stripe.Event;
    logger.warn('Stripe webhook: signature verification skipped (no STRIPE_WEBHOOK_SECRET set)');
  } else {
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      logger.warn({ err }, 'Stripe webhook signature verification failed');
      throw Errors.unauthorized();
    }
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'subscription') break;
      const subscriptionId = session.subscription as string;
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const workspaceId = sub.metadata['workspaceId'];
      if (!workspaceId) break;
      await activatePro(workspaceId, subscriptionId);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const workspaceId = sub.metadata['workspaceId'];
      if (!workspaceId) break;
      if (PLAN_RATES[sub.status]) {
        await activatePro(workspaceId, sub.id);
      } else {
        await deactivatePro(workspaceId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const workspaceId = sub.metadata['workspaceId'];
      if (!workspaceId) break;
      await deactivatePro(workspaceId);
      break;
    }
  }
}

async function activatePro(workspaceId: string, subscriptionId: string) {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { plan: 'pro', sendRatePerHour: 2000, stripeSubscriptionId: subscriptionId },
  });
  logger.info({ workspaceId }, 'Workspace upgraded to Pro');
}

async function deactivatePro(workspaceId: string) {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { plan: 'free', sendRatePerHour: 100, stripeSubscriptionId: null },
  });
  logger.info({ workspaceId }, 'Workspace downgraded to Free');
}
