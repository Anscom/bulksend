import bcrypt from 'bcryptjs';
import { prisma } from '../db/client.js';
import { AppError, Errors } from '../lib/errors.js';

const USER_SELECT = {
  id: true, email: true, name: true, role: true, workspaceId: true, createdAt: true,
} as const;

const WORKSPACE_SELECT = {
  id: true, name: true, slug: true, plan: true, sendRatePerHour: true, createdAt: true, updatedAt: true,
} as const;

export async function getProfile(userId: string, workspaceId: string) {
  const [user, workspace] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT }),
    prisma.workspace.findUnique({ where: { id: workspaceId }, select: WORKSPACE_SELECT }),
  ]);
  if (!user) throw Errors.notFound('User');
  if (!workspace) throw Errors.notFound('Workspace');
  return { user, workspace };
}

export async function updateProfile(userId: string, updates: { name?: string; email?: string }) {
  const { name, email } = updates;
  if (!name && !email) throw new AppError('BAD_REQUEST', 'No fields to update', 400);

  if (email) {
    const conflict = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } });
    if (conflict) throw Errors.conflict('Email already in use');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { ...(name && { name }), ...(email && { email }) },
    select: USER_SELECT,
  });
  return user;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Errors.notFound('User');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError('INVALID_PASSWORD', 'Current password is incorrect', 400);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
