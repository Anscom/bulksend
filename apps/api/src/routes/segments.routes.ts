import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { tenant } from '../middleware/tenant.js';
import { validate } from '../middleware/validate.js';
import * as svc from '../services/segments.service.js';

const router = Router();
router.use(authenticate, tenant);

const FilterSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'neq', 'contains', 'gt', 'lt', 'in', 'exists']),
  value: z.unknown(),
});

const CreateSchema = z.object({
  name: z.string().min(1),
  filters: z.array(FilterSchema),
});

router.get('/', async (req, res, next) => {
  try {
    const page     = Math.max(1, parseInt(String(req.query['page']     ?? '1'),  10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query['pageSize'] ?? '50'), 10) || 50));
    const result   = await svc.listSegments(req.user!.workspaceId, page, pageSize);
    res.json({ ok: true, data: result });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const segment = await svc.getSegment(req.params['id'] as string, req.user!.workspaceId);
    res.json({ ok: true, data: segment });
  } catch (err) { next(err); }
});

router.get('/:id/contacts', async (req, res, next) => {
  try {
    const page     = Math.max(1, parseInt(String(req.query['page']  ?? '1'),  10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(String(req.query['pageSize'] ?? '50'), 10) || 50));
    const result   = await svc.getSegmentContacts(req.params['id'] as string, req.user!.workspaceId, page, pageSize);
    res.json({ ok: true, data: result });
  } catch (err) { next(err); }
});

router.post('/', validate('body', CreateSchema), async (req, res, next) => {
  try {
    const segment = await svc.createSegment(req.user!.workspaceId, req.body);
    res.status(201).json({ ok: true, data: segment });
  } catch (err) { next(err); }
});

router.patch('/:id', validate('body', CreateSchema.partial()), async (req, res, next) => {
  try {
    const segment = await svc.updateSegment(req.params['id'] as string, req.user!.workspaceId, req.body);
    res.json({ ok: true, data: segment });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await svc.deleteSegment(req.params['id'] as string, req.user!.workspaceId);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
