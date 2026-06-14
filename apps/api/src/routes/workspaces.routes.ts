import { Router, type Request } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { tenant } from '../middleware/tenant.js';
import { validate } from '../middleware/validate.js';
import { Errors } from '../lib/errors.js';
import * as svc from '../services/workspaces.service.js';

const router = Router();
router.use(authenticate, tenant);

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
});

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  sendRatePerHour: z.number().int().min(1).max(1_000_000).optional(),
  brevoApiKey: z.string().min(1).optional(),
  senderEmail: z.string().email().optional(),
  senderName: z.string().min(1).optional(),
});

const AddMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(['member', 'admin']).default('member'),
});

function ownWorkspace(req: Request) {
  return (req.params['id'] as string) === req.user!.workspaceId;
}

router.get('/mine', async (req, res, next) => {
  try {
    const workspaces = await svc.listMyWorkspaces(req.user!.userId);
    res.json({ ok: true, data: workspaces });
  } catch (err) { next(err); }
});

router.post('/', validate('body', CreateSchema), async (req, res, next) => {
  try {
    const { name } = req.body as z.infer<typeof CreateSchema>;
    const { workspace } = await svc.createWorkspace(req.user!.userId, name);
    res.status(201).json({ ok: true, data: { workspace } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!ownWorkspace(req)) { next(Errors.forbidden()); return; }
    const workspace = await svc.getWorkspace(req.user!.workspaceId);
    res.json({ ok: true, data: workspace });
  } catch (err) { next(err); }
});

router.patch('/:id', validate('body', UpdateSchema), async (req, res, next) => {
  try {
    if (!ownWorkspace(req)) { next(Errors.forbidden()); return; }
    const workspace = await svc.updateWorkspace(req.user!.workspaceId, req.body);
    res.json({ ok: true, data: workspace });
  } catch (err) { next(err); }
});

router.get('/:id/members', async (req, res, next) => {
  try {
    if (!ownWorkspace(req)) { next(Errors.forbidden()); return; }
    const members = await svc.listMembers(req.user!.workspaceId);
    res.json({ ok: true, data: members });
  } catch (err) { next(err); }
});

router.post('/:id/members', validate('body', AddMemberSchema), async (req, res, next) => {
  try {
    if (!ownWorkspace(req)) { next(Errors.forbidden()); return; }
    if (!['owner', 'admin'].includes(req.user!.role)) { next(Errors.forbidden()); return; }
    const member = await svc.addMember(req.user!.workspaceId, req.body);
    res.status(201).json({ ok: true, data: member });
  } catch (err) { next(err); }
});

router.delete('/:id/members/:userId', async (req, res, next) => {
  try {
    if (!ownWorkspace(req)) { next(Errors.forbidden()); return; }
    if (req.user!.role !== 'owner') { next(Errors.forbidden()); return; }
    await svc.removeMember(req.user!.workspaceId, req.params['userId'] as string, req.user!.userId);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
