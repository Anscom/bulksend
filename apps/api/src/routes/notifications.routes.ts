import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { tenant } from '../middleware/tenant.js';
import * as svc from '../services/notifications.service.js';

const router = Router();
router.use(authenticate, tenant);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await svc.listNotifications(req.user!.workspaceId);
    const unread = notifications.filter(n => !n.read).length;
    res.json({ ok: true, data: { notifications, unread } });
  } catch (err) { next(err); }
});

router.post('/read-all', async (req, res, next) => {
  try {
    await svc.markAllRead(req.user!.workspaceId);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await svc.deleteNotification(req.params['id']!, req.user!.workspaceId);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
