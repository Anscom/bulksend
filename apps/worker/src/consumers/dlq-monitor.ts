import type { Consumer } from 'kafkajs';
import { markUp, markDown } from '../lib/health.js';
import { Topics } from '@bulksend/shared';
import type { EmailSendDlqPayload } from '@bulksend/shared';
import { prisma } from '../db/client.js';
import { logger } from '../lib/logger.js';

/**
 * DLQ monitor — logs exhausted sends with full error trail.
 * In production, extend this to alert via PagerDuty / Slack.
 */
export async function startDlqMonitor(consumer: Consumer): Promise<void> {
  await consumer.connect();
  await consumer.subscribe({ topic: Topics.EMAIL_SEND_DLQ, fromBeginning: false });

  consumer.on(consumer.events.CRASH, () => markDown('dlqMonitor'));
  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ message, partition, topic }) => {
      const payload = JSON.parse(message.value!.toString()) as EmailSendDlqPayload;
      logger.error(
        {
          sendId: payload.sendId,
          campaignId: payload.campaignId,
          email: payload.email,
          errorTrail: payload.errorTrail,
          exhaustedAt: payload.exhaustedAt,
        },
        'Message exhausted — reached DLQ',
      );

      const campaign = await prisma.campaign.findUnique({
        where: { id: payload.campaignId },
        select: { name: true, workspaceId: true },
      });

      if (campaign) {
        await prisma.notification.create({
          data: {
            workspaceId: campaign.workspaceId,
            type: 'campaign_failed',
            title: 'Email delivery failed',
            body: `Could not deliver to ${payload.email} after all retries ("${campaign.name}").`,
            metadata: {
              campaignId: payload.campaignId,
              sendId: payload.sendId,
              errorTrail: payload.errorTrail,
            },
          },
        });
      }

      await consumer.commitOffsets([{ topic, partition, offset: (BigInt(message.offset) + 1n).toString() }]);
    },
  });
  markUp('dlqMonitor');
}
