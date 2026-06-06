import { Router } from 'express';
import { prisma } from '../db/client.js';
import { redis } from '../redis/client.js';
import { suppKey } from '../redis/keys.js';
import { logger } from '../lib/logger.js';

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
  try {
    await prisma.emailEvent.create({
      data: {
        sendId,
        type: 'opened',
        metadata: {
          userAgent: req.headers['user-agent'],
          ip: req.ip,
        },
        occurredAt: new Date(),
        // workspaceId and campaignId denormalized via send lookup in worker
        workspaceId: '',
        campaignId: '',
      },
    }).catch(() => {}); // fire-and-forget; don't block the pixel
  } catch (err) {
    logger.warn({ err, sendId }, 'Open pixel error');
  }

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
  const url = decodeURIComponent(String(req.query['url'] ?? ''));

  if (!url.startsWith('http')) {
    res.status(400).send('Bad redirect');
    return;
  }

  prisma.emailEvent.create({
    data: {
      sendId,
      type: 'clicked',
      metadata: { url, userAgent: req.headers['user-agent'] },
      occurredAt: new Date(),
      workspaceId: '',
      campaignId: '',
    },
  }).catch(() => {});

  res.redirect(302, url);
});

/** GET /t/u/:workspaceId/:contactEmail — unsubscribe handler */
router.get('/u/:workspaceId/:contactEmail', async (req, res) => {
  const { workspaceId, contactEmail } = req.params;
  const email = decodeURIComponent(contactEmail);

  try {
    await Promise.all([
      prisma.contact.updateMany({
        where: { workspaceId, email, deletedAt: null },
        data: { status: 'unsubscribed' },
      }),
      redis.sadd(suppKey(workspaceId), email),
    ]);
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
