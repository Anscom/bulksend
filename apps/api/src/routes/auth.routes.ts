import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import * as authService from '../services/auth.service.js';

const router = Router();

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  workspaceName: z.string().min(1),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RefreshSchema = z.object({ refreshToken: z.string().min(1) });

router.post('/signup', validate('body', SignupSchema), async (req, res, next) => {
  try {
    const { email, password, name, workspaceName } = req.body as z.infer<typeof SignupSchema>;
    const tokens = await authService.signup(email, password, name, workspaceName);
    res.status(201).json({ ok: true, data: tokens });
  } catch (err) { next(err); }
});

router.post('/login', validate('body', LoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof LoginSchema>;
    const tokens = await authService.login(email, password);
    res.json({ ok: true, data: tokens });
  } catch (err) { next(err); }
});

router.post('/refresh', validate('body', RefreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body as z.infer<typeof RefreshSchema>;
    const tokens = await authService.refresh(refreshToken);
    res.json({ ok: true, data: tokens });
  } catch (err) { next(err); }
});

router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const { jti, userId } = req.user!;
    const sid = req.body?.sid ?? '';
    await authService.logout(jti, userId, sid);
    res.status(204).send();
  } catch (err) { next(err); }
});

const SwitchSchema = z.object({ workspaceId: z.string().uuid() });

router.post('/switch', authenticate, validate('body', SwitchSchema), async (req, res, next) => {
  try {
    const { workspaceId } = req.body as z.infer<typeof SwitchSchema>;
    const tokens = await authService.switchWorkspace(req.user!.userId, workspaceId);
    res.json({ ok: true, data: tokens });
  } catch (err) { next(err); }
});

export default router;
