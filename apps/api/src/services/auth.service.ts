import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/client.js';
import { redis } from '../redis/client.js';
import { sessKey, userSessionsKey, jwtBlocklistKey } from '../redis/keys.js';
import { env } from '../lib/env.js';
import { Errors } from '../lib/errors.js';
import type { AuthTokens, LoginResponse, WorkspaceSummary } from '@bulksend/shared';

const SALT_ROUNDS = 12;
const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

export async function signup(
  email: string,
  password: string,
  name: string,
  workspaceName: string,
): Promise<AuthTokens> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw Errors.conflict('Email already in use');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [workspace, user] = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: {
        name: workspaceName,
        slug: workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        plan: 'free',
        sendRatePerHour: 100,
      },
    });

    await tx.segment.create({
      data: {
        workspaceId: ws.id,
        name: 'Active Subscribers',
        filters: [{ field: 'status', operator: 'eq', value: 'subscribed' }],
      },
    });

    const u = await tx.user.create({
      data: { email, name, passwordHash, workspaceId: ws.id, role: 'owner' },
    });

    return [ws, u] as const;
  });

  return await issueTokens(user.id, workspace.id, user.email, user.role);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Errors.unauthorized();

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Errors.unauthorized();

  const tokens = await issueTokens(user.id, user.workspaceId, user.email, user.role);

  // Ensure the default "Active Subscribers" segment exists for this workspace
  const existing = await prisma.segment.findFirst({
    where: { workspaceId: user.workspaceId, name: 'Active Subscribers' },
    select: { id: true },
  });
  if (!existing) {
    await prisma.segment.create({
      data: {
        workspaceId: user.workspaceId,
        name: 'Active Subscribers',
        filters: [{ field: 'status', operator: 'eq', value: 'subscribed' }],
      },
    }).catch(() => {}); // ignore race condition if another login created it simultaneously
  }

  // Collect all workspaces: primary + any granted via WorkspaceAccess
  const [primaryWs, accesses] = await Promise.all([
    prisma.workspace.findUniqueOrThrow({
      where: { id: user.workspaceId },
      select: { id: true, name: true, slug: true, plan: true },
    }),
    prisma.workspaceAccess.findMany({
      where: { userId: user.id },
      include: { workspace: { select: { id: true, name: true, slug: true, plan: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const seen = new Set([primaryWs.id]);
  const workspaces: WorkspaceSummary[] = [
    { id: primaryWs.id, name: primaryWs.name, slug: primaryWs.slug, plan: primaryWs.plan },
    ...accesses
      .filter(a => !seen.has(a.workspace.id) && seen.add(a.workspace.id))
      .map(a => ({ id: a.workspace.id, name: a.workspace.name, slug: a.workspace.slug, plan: a.workspace.plan })),
  ];

  return { ...tokens, workspaces };
}

export async function switchWorkspace(userId: string, targetWorkspaceId: string): Promise<AuthTokens> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  // Switching to their primary workspace
  if (user.workspaceId === targetWorkspaceId) {
    return await issueTokens(user.id, user.workspaceId, user.email, user.role);
  }

  // Switching to a workspace granted via WorkspaceAccess
  const access = await prisma.workspaceAccess.findFirst({
    where: { userId, workspaceId: targetWorkspaceId },
  });
  if (!access) throw Errors.forbidden();

  return await issueTokens(user.id, targetWorkspaceId, user.email, access.role);
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  let payload: { userId: string; workspaceId: string; email: string; role: string; sid: string };
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as typeof payload;
  } catch {
    throw Errors.unauthorized();
  }

  const sessionRaw = await redis.hgetall(sessKey(payload.sid));
  if (!sessionRaw || !sessionRaw['userId']) throw Errors.unauthorized();

  const hashedToken = await bcrypt.hash(refreshToken, 4);
  const stored = sessionRaw['rtHash'] as string | undefined;
  if (stored && !(await bcrypt.compare(refreshToken, stored))) {
    // Refresh token reuse detected — revoke entire session
    await redis.del(sessKey(payload.sid));
    throw Errors.unauthorized();
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });
  await redis.hset(sessKey(payload.sid), { rtHash: hashedToken });

  return await issueTokens(user.id, user.workspaceId, user.email, user.role, payload.sid);
}

export async function logout(jti: string, userId: string, sid: string): Promise<void> {
  // Blocklist the access token (short-lived, so TTL of 15m is fine)
  await redis.set(jwtBlocklistKey(jti), '1', { ex: 15 * 60 });
  await redis.del(sessKey(sid));
  await redis.srem(userSessionsKey(userId), sid);
}

async function issueTokens(
  userId: string,
  workspaceId: string,
  email: string,
  role: string,
  existingSid?: string,
): Promise<AuthTokens> {
  const jti = uuidv4();
  const sid = existingSid ?? uuidv4();

  const accessToken = jwt.sign({ userId, workspaceId, email, role, jti }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`,
  });

  const refreshToken = jwt.sign({ userId, workspaceId, email, role, sid }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`,
  });

  // Store session in Redis
  const pipeline = redis.pipeline();
  pipeline.hset(sessKey(sid), { userId, workspaceId, role });
  pipeline.expire(sessKey(sid), SESSION_TTL);
  pipeline.sadd(userSessionsKey(userId), sid);
  await pipeline.exec();

  return { accessToken, refreshToken, expiresIn: 15 * 60 };
}
