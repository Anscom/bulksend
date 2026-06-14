import bcrypt from 'bcryptjs';
import { prisma } from '../db/client.js';
import { Errors, AppError } from '../lib/errors.js';
import type { Workspace, User, WorkspaceSummary } from '@bulksend/shared';

const WORKSPACE_SELECT = {
  id: true, name: true, slug: true, plan: true, sendRatePerHour: true, brevoApiKey: true, senderEmail: true, senderName: true, createdAt: true, updatedAt: true,
} as const;

const MEMBER_SELECT = {
  id: true, workspaceId: true, email: true, name: true, role: true, createdAt: true, updatedAt: true,
} as const;

// ── Workspace CRUD ─────────────────────────────────────────────────────────

export async function getWorkspace(workspaceId: string): Promise<Workspace> {
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: WORKSPACE_SELECT });
  if (!ws) throw Errors.notFound('Workspace');
  return ws as unknown as Workspace;
}

export async function updateWorkspace(
  workspaceId: string,
  updates: { name?: string; sendRatePerHour?: number; brevoApiKey?: string; senderEmail?: string; senderName?: string },
): Promise<Workspace> {
  const ws = await prisma.workspace.update({
    where: { id: workspaceId },
    data: updates,
    select: WORKSPACE_SELECT,
  });
  return ws as unknown as Workspace;
}

// ── Multi-workspace ────────────────────────────────────────────────────────

export async function listMyWorkspaces(userId: string): Promise<WorkspaceSummary[]> {
  const [user, accesses] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { workspace: { select: { id: true, name: true, slug: true, plan: true } } },
    }),
    prisma.workspaceAccess.findMany({
      where: { userId },
      include: { workspace: { select: { id: true, name: true, slug: true, plan: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const primary = user.workspace;
  const seen = new Set([primary.id]);

  return [
    { id: primary.id, name: primary.name, slug: primary.slug, plan: primary.plan },
    ...accesses
      .filter(a => !seen.has(a.workspace.id) && seen.add(a.workspace.id))
      .map(a => ({ id: a.workspace.id, name: a.workspace.name, slug: a.workspace.slug, plan: a.workspace.plan })),
  ];
}

export async function createWorkspace(
  currentUserId: string,
  workspaceName: string,
): Promise<{ workspace: Workspace }> {
  const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

  const workspace = await prisma.workspace.create({
    data: { name: workspaceName, slug: uniqueSlug, plan: 'free', sendRatePerHour: 100 },
    select: WORKSPACE_SELECT,
  });

  // Grant the creator owner access via WorkspaceAccess (no User duplication)
  await prisma.workspaceAccess.create({
    data: { userId: currentUserId, workspaceId: workspace.id, role: 'owner' },
  });

  return { workspace: workspace as unknown as Workspace };
}

// ── Members ────────────────────────────────────────────────────────────────

export async function listMembers(workspaceId: string): Promise<User[]> {
  // Native members: users whose primary workspace is this one
  const nativeUsers = await prisma.user.findMany({
    where: { workspaceId },
    select: MEMBER_SELECT,
    orderBy: { createdAt: 'asc' },
  });

  // Access-based members: users who have WorkspaceAccess to this workspace
  const accesses = await prisma.workspaceAccess.findMany({
    where: { workspaceId },
    include: { user: { select: MEMBER_SELECT } },
    orderBy: { createdAt: 'asc' },
  });

  const nativeIds = new Set(nativeUsers.map(u => u.id));
  const accessUsers = accesses
    .filter(a => !nativeIds.has(a.user.id))
    .map(a => ({ ...a.user, role: a.role }));

  return [...nativeUsers, ...accessUsers] as unknown as User[];
}

export async function addMember(
  workspaceId: string,
  data: { email: string; name: string; password: string; role: 'member' | 'admin' },
): Promise<User> {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });

  if (existingUser) {
    // Already a native member of this workspace
    if (existingUser.workspaceId === workspaceId) {
      throw Errors.conflict('This email is already a member of this workspace');
    }
    // Already has WorkspaceAccess
    const existingAccess = await prisma.workspaceAccess.findFirst({
      where: { userId: existingUser.id, workspaceId },
    });
    if (existingAccess) {
      throw Errors.conflict('This email already has access to this workspace');
    }
    // Grant access to the existing user
    await prisma.workspaceAccess.create({
      data: { userId: existingUser.id, workspaceId, role: data.role },
    });
    return { ...existingUser, role: data.role } as unknown as User;
  }

  // Brand-new user — create with native membership
  const passwordHash = await bcrypt.hash(data.password, 12);
  const member = await prisma.user.create({
    data: { email: data.email, name: data.name, passwordHash, workspaceId, role: data.role },
    select: MEMBER_SELECT,
  });
  return member as unknown as User;
}

export async function removeMember(
  workspaceId: string,
  memberId: string,
  requesterId: string,
): Promise<void> {
  if (memberId === requesterId) {
    throw new AppError('BAD_REQUEST', 'You cannot remove yourself', 400);
  }

  // Native member?
  const native = await prisma.user.findFirst({ where: { id: memberId, workspaceId } });
  if (native) {
    if (native.role === 'owner') throw new AppError('BAD_REQUEST', 'Cannot remove the workspace owner', 400);
    await prisma.user.delete({ where: { id: memberId } });
    return;
  }

  // WorkspaceAccess member?
  const access = await prisma.workspaceAccess.findFirst({ where: { userId: memberId, workspaceId } });
  if (!access) throw Errors.notFound('Member');
  if (access.role === 'owner') throw new AppError('BAD_REQUEST', 'Cannot remove the workspace owner', 400);
  await prisma.workspaceAccess.delete({ where: { id: access.id } });
}
