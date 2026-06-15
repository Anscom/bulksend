import type { Producer } from 'kafkajs';
import { Topics } from '@bulksend/shared';
import type { CampaignDispatchPayload } from '@bulksend/shared';
import { prisma } from '../db/client.js';
import { logger } from './logger.js';

const POLL_INTERVAL_MS = 60_000;

/**
 * Polls every 60 s for campaigns whose scheduledAt has passed and fires them.
 *
 * The status CAS (`updateMany` with `status: 'scheduled'` in WHERE) prevents
 * double-dispatch when multiple worker replicas run simultaneously.
 */
export function startScheduler(producer: Producer): () => void {
  async function tick(): Promise<void> {
    const now = new Date();

    const due = await prisma.campaign.findMany({
      where: { status: 'scheduled', scheduledAt: { lte: now } },
      select: { id: true, workspaceId: true },
    });

    if (due.length === 0) return;
    logger.info({ count: due.length }, 'Scheduler: firing due campaigns');

    for (const campaign of due) {
      // CAS on status — only one worker wins if multiple replicas race
      const claimed = await prisma.campaign.updateMany({
        where: { id: campaign.id, status: 'scheduled' },
        data: { status: 'sending' },
      });
      if (claimed.count === 0) {
        logger.info({ campaignId: campaign.id }, 'Scheduler: campaign already claimed, skipping');
        continue;
      }

      const payload: CampaignDispatchPayload = {
        campaignId: campaign.id,
        workspaceId: campaign.workspaceId,
        dispatchedAt: now.toISOString(),
      };

      try {
        await producer.send({
          topic: Topics.CAMPAIGN_DISPATCH,
          messages: [{ key: campaign.id, value: JSON.stringify(payload) }],
        });
        logger.info({ campaignId: campaign.id }, 'Scheduler: campaign dispatched');
      } catch (err) {
        // Roll back status so the next tick retries
        await prisma.campaign.updateMany({
          where: { id: campaign.id, status: 'sending' },
          data: { status: 'scheduled' },
        });
        logger.error({ err, campaignId: campaign.id }, 'Scheduler: dispatch failed, rolled back');
      }
    }
  }

  // Run immediately on startup then on interval
  tick().catch(err => logger.error({ err }, 'Scheduler: initial tick error'));
  const timer = setInterval(() => {
    tick().catch(err => logger.error({ err }, 'Scheduler: tick error'));
  }, POLL_INTERVAL_MS);

  return () => clearInterval(timer);
}
