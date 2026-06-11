import { type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../db/client.js';
import { redis } from '../redis/client.js';
import { rlKey } from '../redis/keys.js';
import { AppError } from '../lib/errors.js';

const PLAN_LIMITS: Record<string, number> = {
  free: 100,
  pro: 2000,
  enterprise: Infinity,
};

/**
 * Billing-cap rate limiter (hourly fixed-window).
 * Loads workspace plan from DB; apply only to endpoints that consume send quota.
 */
export async function rateLimit(req: Request, _res: Response, next: NextFunction) {
  const { workspaceId } = req.user!;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true },
  });

  const plan = workspace?.plan ?? 'free';
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS['free']!;

  if (limit === Infinity) return next();

  const key = rlKey(workspaceId);
  const count = await redis.incr(key);

  if (count === 1) {
    const now = new Date();
    const secondsToNextHour = (60 - now.getMinutes()) * 60 - now.getSeconds();
    await redis.expire(key, secondsToNextHour + 60);
  }

  if (count > limit) {
    return next(
      new AppError('RATE_LIMITED', `Hourly send limit of ${limit} reached`, 429, {
        limit,
        current: count,
        resetsAt: new Date(Math.ceil(Date.now() / 3_600_000) * 3_600_000).toISOString(),
      }),
    );
  }

  next();
}
