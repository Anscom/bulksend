import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { tenant } from '../middleware/tenant.js';
import * as svc from '../services/analytics.service.js';

const router = Router();
router.use(authenticate, tenant);

router.get('/overview', async (req, res, next) => {
  try {
    const overview = await svc.getOverview(req.user!.workspaceId);
    res.json({ ok: true, data: overview });
  } catch (err) { next(err); }
});

router.get('/volume', async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query['days']) || 30, 1), 365);
    const volume = await svc.getVolume(req.user!.workspaceId, days);
    res.json({ ok: true, data: volume });
  } catch (err) { next(err); }
});

router.get('/usage', async (req, res, next) => {
  try {
    const usage = await svc.getUsage(req.user!.workspaceId);
    res.json({ ok: true, data: usage });
  } catch (err) { next(err); }
});

router.get('/campaigns', async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 20));
    const rows = await svc.getCampaignPerformance(req.user!.workspaceId, limit);
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
});

export default router;
