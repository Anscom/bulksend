import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { validate } from '../middleware/validate.js';
import { prisma } from '../db/client.js';
import { AppError, Errors } from '../lib/errors.js';

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
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, role: true, workspaceId: true, createdAt: true },
    });
    if (!user) return next(Errors.notFound('User'));

    const workspace = await prisma.workspace.findUnique({
      where: { id: req.user!.workspaceId },
      select: { id: true, name: true, slug: true, plan: true, sendRatePerHour: true, createdAt: true, updatedAt: true },
    });
    if (!workspace) return next(Errors.notFound('Workspace'));

    res.json({ ok: true, data: { user, workspace } });
  } catch (err) { next(err); }
});

router.patch('/me', validate('body', UpdateProfileSchema), async (req, res, next) => {
  try {
    const { name, email } = req.body as z.infer<typeof UpdateProfileSchema>;
    if (!name && !email) return res.status(400).json({ ok: false, error: { code: 'BAD_REQUEST', message: 'No fields to update' } });

    if (email) {
      const existing = await prisma.user.findFirst({ where: { email, NOT: { id: req.user!.userId } } });
      if (existing) return next(Errors.conflict('Email already in use'));
    }

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { ...(name && { name }), ...(email && { email }) },
      select: { id: true, email: true, name: true, role: true, workspaceId: true, createdAt: true },
    });

    res.json({ ok: true, data: { user } });
  } catch (err) { next(err); }
});

router.post('/me/change-password', validate('body', ChangePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body as z.infer<typeof ChangePasswordSchema>;

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return next(Errors.notFound('User'));

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return next(new AppError('INVALID_PASSWORD', 'Current password is incorrect', 400));

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user!.userId }, data: { passwordHash } });

    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
