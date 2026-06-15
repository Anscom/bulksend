import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { tenant } from '../middleware/tenant.js';
import { validate } from '../middleware/validate.js';
import * as svc from '../services/contacts.service.js';

const router = Router();
router.use(authenticate, tenant);

const CreateSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  attributes: z.record(z.unknown()).optional(),
});

const ImportSchema = z.object({
  csv: z.string().min(1),
  mapping: z.record(z.string()),
});

router.get('/export', async (req, res, next) => {
  try {
    const status = req.query['status'] as string | undefined;
    const csv = await svc.exportContacts(req.user!.workspaceId, status);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
    res.send(csv);
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const pageSize = Number(req.query['pageSize']) || 50;
    const status = req.query['status'] as string | undefined;
    const search = req.query['search'] as string | undefined;
    const cursor = req.query['cursor'] as string | undefined;
    const result = await svc.listContacts(req.user!.workspaceId, pageSize, status, search, cursor);
    res.json({ ok: true, data: result });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const contact = await svc.getContact(req.params['id'] as string, req.user!.workspaceId);
    res.json({ ok: true, data: contact });
  } catch (err) { next(err); }
});

router.post('/', validate('body', CreateSchema), async (req, res, next) => {
  try {
    const contact = await svc.createContact(req.user!.workspaceId, req.body);
    res.status(201).json({ ok: true, data: contact });
  } catch (err) { next(err); }
});

router.patch('/:id', validate('body', CreateSchema.partial()), async (req, res, next) => {
  try {
    const contact = await svc.updateContact(req.params['id'] as string, req.user!.workspaceId, req.body);
    res.json({ ok: true, data: contact });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await svc.deleteContact(req.params['id'] as string, req.user!.workspaceId);
    res.status(204).send();
  } catch (err) { next(err); }
});

router.post('/import', validate('body', ImportSchema), async (req, res, next) => {
  try {
    const { csv, mapping } = req.body as z.infer<typeof ImportSchema>;
    const result = await svc.importContacts(req.user!.workspaceId, csv, mapping);
    res.status(202).json({ ok: true, data: result });
  } catch (err) { next(err); }
});

export default router;
