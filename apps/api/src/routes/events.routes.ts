import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { tenant } from '../middleware/tenant.js';
import * as svc from '../services/events-list.service.js';
import type { EventType } from '@bulksend/shared';

const VALID_TYPES = new Set<string>(['opened', 'clicked', 'bounced', 'unsubscribed', 'delivered', 'spam']);

const router = Router();
router.use(authenticate, tenant);

router.get('/', async (req, res, next) => {
  try {
    const page     = Math.max(1, Number(req.query['page']) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query['pageSize']) || 50));
    const rawType  = String(req.query['type'] ?? '');
    const type     = VALID_TYPES.has(rawType) ? (rawType as EventType) : null;

    const result = await svc.listEvents(req.user!.workspaceId, { page, pageSize, type });
    res.json({ ok: true, data: result });
  } catch (err) { next(err); }
});

export default router;
