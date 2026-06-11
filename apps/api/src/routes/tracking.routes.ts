import { Router } from 'express';
import { logger } from '../lib/logger.js';
import * as trackingService from '../services/tracking.service.js';

// Public routes — no JWT auth. Authenticated by short-lived signed tokens embedded in emails.
const router = Router();

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

/** GET /t/o/:sendId — open tracking pixel */
router.get('/o/:sendId', (req, res) => {
  const { sendId } = req.params;

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
router.get('/c/:sendId', (req, res) => {
  const { sendId } = req.params;
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

/** GET /t/u/:workspaceId/:contactEmail — one-click unsubscribe */
router.get('/u/:workspaceId/:contactEmail', async (req, res) => {
  const { workspaceId, contactEmail } = req.params;
  const email = decodeURIComponent(contactEmail!);

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
