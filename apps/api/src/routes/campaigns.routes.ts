import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { tenant } from '../middleware/tenant.js';
import { validate } from '../middleware/validate.js';
import { rateLimit } from '../middleware/rate-limit.js';
import * as svc from '../services/campaigns.service.js';
import { sendTestEmail } from '../services/email.service.js';

const router = Router();
router.use(authenticate, tenant);

const CreateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  previewText: z.string().optional(),
  fromName: z.string().min(1),
  fromEmail: z.string().email().refine(e => !e.toLowerCase().endsWith('@acme.co'), {
    message: 'Please use your own domain, not the placeholder @acme.co',
  }),
  bodyHtml: z.string().min(1),
  bodyText: z.string().min(1),
  segmentId: z.string().uuid().optional(),
});

const ScheduleSchema = z.object({ scheduledAt: z.string().datetime() });
const TestSendSchema = z.object({ email: z.string().email() });

router.get('/', async (req, res, next) => {
  try {
    const page = Number(req.query['page']) || 1;
    const pageSize = Number(req.query['pageSize']) || 20;
    const result = await svc.listCampaigns(req.user!.workspaceId, page, pageSize);
    res.json({ ok: true, data: result });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const campaign = await svc.getCampaign(req.params['id'] as string, req.user!.workspaceId);
    res.json({ ok: true, data: campaign });
  } catch (err) { next(err); }
});

router.get('/:id/stats', async (req, res, next) => {
  try {
    const stats = await svc.getCampaignStats(req.params['id'] as string, req.user!.workspaceId);
    res.json({ ok: true, data: stats });
  } catch (err) { next(err); }
});

router.get('/:id/sends', async (req, res, next) => {
  try {
    const page = Number(req.query['page']) || 1;
    const pageSize = Math.min(500, Number(req.query['pageSize']) || 200);
    const result = await svc.getCampaignSends(req.params['id'] as string, req.user!.workspaceId, page, pageSize);
    res.json({ ok: true, data: result });
  } catch (err) { next(err); }
});

router.post('/', validate('body', CreateSchema), async (req, res, next) => {
  try {
    const campaign = await svc.createCampaign(req.user!.workspaceId, req.body);
    res.status(201).json({ ok: true, data: campaign });
  } catch (err) { next(err); }
});

router.patch('/:id', validate('body', CreateSchema.partial()), async (req, res, next) => {
  try {
    const campaign = await svc.updateCampaign(req.params['id'] as string, req.user!.workspaceId, req.body);
    res.json({ ok: true, data: campaign });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await svc.deleteCampaign(req.params['id'] as string, req.user!.workspaceId);
    res.status(204).send();
  } catch (err) { next(err); }
});

router.post('/:id/schedule', validate('body', ScheduleSchema), async (req, res, next) => {
  try {
    const { scheduledAt } = req.body as z.infer<typeof ScheduleSchema>;
    const campaign = await svc.scheduleCampaign(req.params['id'] as string, req.user!.workspaceId, new Date(scheduledAt));
    res.json({ ok: true, data: campaign });
  } catch (err) { next(err); }
});

router.post('/:id/pause', async (req, res, next) => {
  try {
    const campaign = await svc.pauseCampaign(req.params['id'] as string, req.user!.workspaceId);
    res.json({ ok: true, data: campaign });
  } catch (err) { next(err); }
});

router.post('/:id/resume', async (req, res, next) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string ?? `${req.params['id']}-resume-${Date.now()}`;
    const campaign = await svc.resumeCampaign(req.params['id'] as string, req.user!.workspaceId, idempotencyKey);
    res.json({ ok: true, data: campaign });
  } catch (err) { next(err); }
});

router.post('/:id/test-send', validate('body', TestSendSchema), async (req, res, next) => {
  try {
    const { email } = req.body as z.infer<typeof TestSendSchema>;
    await sendTestEmail(req.params['id'] as string, req.user!.workspaceId, email);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/:id/send', rateLimit, async (req, res, next) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string ?? `${req.params['id']}-${Date.now()}`;
    const campaign = await svc.sendCampaign(req.params['id'] as string, req.user!.workspaceId, idempotencyKey);
    res.status(202).json({ ok: true, data: campaign });
  } catch (err) { next(err); }
});

export default router;
