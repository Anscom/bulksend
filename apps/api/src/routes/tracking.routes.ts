import { Router } from 'express';
import { logger } from '../lib/logger.js';
import { redis } from '../redis/client.js';
import { env } from '../lib/env.js';
import * as trackingService from '../services/tracking.service.js';
import { verifyUnsubscribeToken as _verify } from '../lib/unsubscribe.js';

function verifyUnsubscribeToken(workspaceId: string, email: string, token: string): boolean {
  return _verify(workspaceId, email, token, env.TRACKING_SECRET);
}

async function trackingRateLimit(ip: string): Promise<boolean> {
  const key = `track:ip:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  return count <= 60; // 60 requests per minute per IP
}

// Public routes — no JWT auth. Authenticated by short-lived signed tokens embedded in emails.
const router = Router();

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

/** GET /t/o/:sendId — open tracking pixel */
router.get('/o/:sendId', async (req, res) => {
  const { sendId } = req.params;
  const allowed = await trackingRateLimit(req.ip ?? '').catch(() => true);
  if (!allowed) { res.status(429).send(); return; }

  trackingService.recordOpen(sendId, req.headers['user-agent'], req.ip).catch((err) => {
    logger.warn({ err, sendId }, 'Open pixel error');
  });

  res.set({
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    Expires: '0',
  });
  res.send(PIXEL);
});

/** GET /t/c/:sendId?url=... — click redirect */
router.get('/c/:sendId', async (req, res) => {
  const { sendId } = req.params;
  const allowed = await trackingRateLimit(req.ip ?? '').catch(() => true);
  if (!allowed) { res.status(429).send(); return; }

  const url = decodeURIComponent(String(req.query['url'] ?? ''));

  if (!url.startsWith('http')) {
    res.status(400).send('Bad redirect');
    return;
  }

  trackingService.recordClick(sendId, url, req.headers['user-agent']).catch((err) => {
    logger.warn({ err, sendId }, 'Click track error');
  });

  res.redirect(302, url);
});

/** GET /t/u/:workspaceId/:contactEmail?token=... — one-click unsubscribe */
router.get('/u/:workspaceId/:contactEmail', async (req, res) => {
  const { workspaceId, contactEmail } = req.params;
  const email = decodeURIComponent(contactEmail!);
  const token = String(req.query['token'] ?? '');

  const allowed = await trackingRateLimit(req.ip ?? '').catch(() => true);
  if (!allowed) { res.status(429).send('Too many requests'); return; }

  if (!token || !verifyUnsubscribeToken(workspaceId!, email, token)) {
    logger.warn({ workspaceId, email }, 'Invalid unsubscribe token');
    res.status(403).send('Invalid unsubscribe link');
    return;
  }

  try {
    await trackingService.unsubscribeContact(workspaceId!, email);
  } catch (err) {
    logger.error({ err }, 'Unsubscribe error');
  }

  res.send(`
    <!doctype html><html><body style="font-family:sans-serif;text-align:center;padding:60px">
      <h2>You've been unsubscribed</h2>
      <p>You will no longer receive emails from this sender.</p>
    </body></html>
  `);
});

export default router;
