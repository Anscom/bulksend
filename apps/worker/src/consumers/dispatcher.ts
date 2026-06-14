import type { Consumer, Producer } from 'kafkajs';
import { Topics, CONSUMER_GROUPS, buildSegmentContactFilter } from '@bulksend/shared';
import type { CampaignDispatchPayload, EmailSendPayload, RawFilter } from '@bulksend/shared';
import { prisma } from '../db/client.js';
import { redis } from '../redis/client.js';
import { logger } from '../lib/logger.js';
import { v4 as uuidv4 } from 'uuid';

const CONTACT_PAGE_SIZE = 500;
const remainingKey = (id: string) => `campaign:${id}:remaining`;

/**
 * Dispatcher — consumes campaign.dispatch, pages all target contacts,
 * bulk-inserts sends, fans out per-recipient jobs to email.send,
 * and seeds the Redis completion counter.
 *
 * Crash-safe: contacts already in sends table are skipped (ON CONFLICT).
 */
export async function startDispatcher(consumer: Consumer, producer: Producer): Promise<void> {
  await consumer.connect();
  await consumer.subscribe({ topic: Topics.CAMPAIGN_DISPATCH, fromBeginning: false });

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ message, partition, topic }) => {
      const payload = JSON.parse(message.value!.toString()) as CampaignDispatchPayload;
      const { campaignId, workspaceId } = payload;
      const log = logger.child({ campaignId, workspaceId });

      log.info('Dispatching campaign');

      try {
        const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, workspaceId } });
        if (!campaign) { log.warn('Campaign not found'); return; }
        if (campaign.status !== 'sending') { log.warn('Campaign not in sending state, skipping'); return; }

        const segment = campaign.segmentId
          ? await prisma.segment.findUnique({ where: { id: campaign.segmentId } })
          : null;

        const segmentFilters = segment
          ? (segment.filters as unknown as RawFilter[])
          : [];
        const baseContactWhere = {
          ...buildSegmentContactFilter(workspaceId, segmentFilters),
          status: 'subscribed', // always enforce — never send to unsubscribed contacts
        };

        let cursor: string | undefined;
        let totalFannedOut = 0;
        const allMessages: Array<{ key: string; value: string }> = [];

        // Page through contacts to avoid loading millions into memory
        do {
          const contacts = await prisma.contact.findMany({
            where: {
              ...baseContactWhere,
              ...(cursor ? { id: { gt: cursor } } : {}),
            } as never,
            orderBy: { id: 'asc' },
            take: CONTACT_PAGE_SIZE,
            select: { id: true, email: true, firstName: true, lastName: true },
          });

          if (contacts.length === 0) break;

          // Bulk-insert sends rows (idempotent — skipDuplicates = ON CONFLICT DO NOTHING)
          await prisma.send.createMany({
            data: contacts.map(contact => ({
              workspaceId,
              campaignId,
              contactId: contact.id,
            })),
            skipDuplicates: true,
          });

          for (const contact of contacts) {
            const sendPayload: EmailSendPayload = {
              sendId: uuidv4(), // Will be replaced with real send ID from DB
              campaignId,
              workspaceId,
              contactId: contact.id,
              email: contact.email,
              subject: campaign.subject,
              fromName: campaign.fromName,
              fromEmail: campaign.fromEmail,
              bodyHtml: campaign.bodyHtml,
              bodyText: campaign.bodyText,
              variables: {
                first_name: contact.firstName ?? '',
                last_name: contact.lastName ?? '',
                email: contact.email,
              },
              attempt: 1,
              idempotencyKey: `${campaignId}:${contact.id}:1`,
            };

            allMessages.push({ key: contact.id, value: JSON.stringify(sendPayload) });
          }

          cursor = contacts.at(-1)?.id;
          totalFannedOut += contacts.length;
        } while (true);

        // Seed completion counter before producing (prevents race where worker finishes before counter is set)
        await redis.set(remainingKey(campaignId), totalFannedOut);

        // Produce all in one batch
        await producer.send({ topic: Topics.EMAIL_SEND, messages: allMessages });

        // Update campaign total
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { totalRecipients: totalFannedOut },
        });

        log.info({ totalFannedOut }, 'Campaign dispatch complete');

        await consumer.commitOffsets([{ topic, partition, offset: (BigInt(message.offset) + 1n).toString() }]);
      } catch (err) {
        log.error({ err }, 'Dispatch error');
        throw err; // Let KafkaJS retry via at-least-once semantics
      }
    },
  });
}
