import { redis } from '../redis/client.js';
import { prisma } from '../db/client.js';
import { logger } from '../lib/logger.js';

const suppKey = (wsId: string) => `supp:${wsId}`;
const loadedKey = (wsId: string) => `${suppKey(wsId)}:loaded`;

/**
 * Returns true if the email is suppressed (unsubscribed or bounced).
 * Checks Redis first; falls back to Postgres if the cache isn't loaded.
 * Compliance: if the cache is absent, we err safe — check DB.
 */
export async function isSuppressed(workspaceId: string, email: string): Promise<boolean> {
  const loaded = await redis.exists(loadedKey(workspaceId));

  if (loaded) {
    return (await redis.sismember(suppKey(workspaceId), email)) === 1;
  }

  // Cache not loaded — check DB and rebuild lazily
  const contact = await prisma.contact.findFirst({
    where: { workspaceId, email, status: { in: ['unsubscribed', 'bounced'] }, deletedAt: null },
    select: { id: true },
  });

  if (contact) {
    await redis.sadd(suppKey(workspaceId), email);
    return true;
  }

  // Trigger an async rebuild so future checks hit Redis
  rebuildSuppressionCache(workspaceId).catch((err) =>
    logger.warn({ err, workspaceId }, 'Suppression cache rebuild failed'),
  );

  return false;
}

async function rebuildSuppressionCache(workspaceId: string): Promise<void> {
  const suppressed = await prisma.contact.findMany({
    where: { workspaceId, status: { in: ['unsubscribed', 'bounced'] }, deletedAt: null },
    select: { email: true },
  });

  if (suppressed.length === 0) return;

  await redis
    .multi()
    .sadd(suppKey(workspaceId), ...suppressed.map((c) => c.email))
    .set(loadedKey(workspaceId), '1')
    .exec();
}
