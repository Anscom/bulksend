import type { Consumer } from 'kafkajs';
import { markUp, markDown } from '../lib/health.js';
import { Topics } from '@bulksend/shared';
import type { EmailEventPayload } from '@bulksend/shared';
import { prisma } from '../db/client.js';
import { logger } from '../lib/logger.js';

export async function startEventWorker(consumer: Consumer): Promise<void> {
  await consumer.connect();
  await consumer.subscribe({ topic: Topics.EMAIL_EVENTS, fromBeginning: false });

  consumer.on(consumer.events.CRASH, () => markDown('eventWorker'));
  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ message, partition, topic }) => {
      const raw = JSON.parse(message.value!.toString()) as EmailEventPayload & {
        providerMessageId?: string;
      };

      try {
        // Resolve send by provider message ID if IDs are not populated
        let sendId = raw.sendId;
        let campaignId = raw.campaignId;
        let workspaceId = raw.workspaceId;

        if (!sendId && raw.providerMessageId) {
          const send = await prisma.send.findUnique({
            where: { providerMessageId: raw.providerMessageId },
            select: { id: true, campaignId: true, workspaceId: true, contactId: true },
          });
          if (!send) {
            // Throw so KafkaJS retries — the Send record may not have been written yet
            throw new Error(`Send not found for providerMessageId ${raw.providerMessageId}`);
          }
          sendId = send.id;
          campaignId = send.campaignId;
          workspaceId = send.workspaceId;
        }

        // Idempotent insert
        await prisma.emailEvent.upsert({
          where: { providerEventId: raw.providerEventId ?? `${sendId}:${raw.type}:${raw.occurredAt}` },
          create: {
            sendId,
            campaignId,
            workspaceId,
            type: raw.type,
            metadata: raw.metadata as never,
            providerEventId: raw.providerEventId,
            occurredAt: new Date(raw.occurredAt),
          },
          update: {},
        });

        // If bounce/unsub, update contact status
        if (raw.type === 'bounced' || raw.type === 'unsubscribed') {
          await prisma.send.update({
            where: { id: sendId },
            data: { status: raw.type === 'bounced' ? 'bounced' : 'unsubscribed' },
          });
        }

        await commitOffset(consumer, topic, partition, message.offset);
      } catch (err) {
        logger.error({ err, raw }, 'Event worker error');
        throw err;
      }
    },
  });
  markUp('eventWorker');
}

async function commitOffset(
  consumer: Consumer,
  topic: string,
  partition: number,
  offset: string,
): Promise<void> {
  await consumer.commitOffsets([{ topic, partition, offset: (BigInt(offset) + 1n).toString() }]);
}
