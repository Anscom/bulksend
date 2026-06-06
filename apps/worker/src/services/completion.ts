import { redis } from '../redis/client.js';
import { prisma } from '../db/client.js';
import { logger } from '../lib/logger.js';

const remainingKey = (campaignId: string) => `campaign:${campaignId}:remaining`;

/**
 * Decrement the shared remaining counter for a campaign.
 * Returns true when this send was the last one (counter hit 0).
 * Gated by the DB status transition so double-delivery is a no-op.
 */
export async function decrementAndCheck(
  campaignId: string,
  workspaceId: string,
): Promise<boolean> {
  const remaining = await redis.decr(remainingKey(campaignId));
  if (remaining <= 0) {
    await closeCampaign(campaignId, workspaceId);
    return true;
  }
  return false;
}

async function closeCampaign(campaignId: string, workspaceId: string): Promise<void> {
  // Guard: only the first worker to set status='sent' wins (idempotent)
  const updated = await prisma.campaign.updateMany({
    where: { id: campaignId, workspaceId, status: 'sending' },
    data: { status: 'sent', sentAt: new Date() },
  });

  if (updated.count > 0) {
    logger.info({ campaignId }, 'Campaign marked as sent');
  }
}

/**
 * Reconciliation sweeper — re-derives truth from Postgres.
 * Run periodically to heal counter drift caused by eviction or crashes.
 */
export async function reconcile(campaignId: string): Promise<void> {
  const [total, terminal] = await Promise.all([
    prisma.send.count({ where: { campaignId } }),
    prisma.send.count({ where: { campaignId, status: { not: 'pending' } } }),
  ]);

  const remaining = Math.max(0, total - terminal);
  await redis.set(remainingKey(campaignId), remaining);

  if (remaining === 0) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (campaign?.status === 'sending') {
      await closeCampaign(campaignId, campaign.workspaceId);
    }
  }
}
