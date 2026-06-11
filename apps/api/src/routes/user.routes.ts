import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import * as usersService from '../services/users.service.js';

const router = Router();

const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

router.get('/me', async (req, res, next) => {
  try {
    const data = await usersService.getProfile(req.user!.userId, req.user!.workspaceId);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
});

router.patch('/me', validate('body', UpdateProfileSchema), async (req, res, next) => {
  try {
    const user = await usersService.updateProfile(req.user!.userId, req.body);
    res.json({ ok: true, data: { user } });
  } catch (err) { next(err); }
});

router.post('/me/change-password', validate('body', ChangePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body as z.infer<typeof ChangePasswordSchema>;
    await usersService.changePassword(req.user!.userId, currentPassword, newPassword);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
