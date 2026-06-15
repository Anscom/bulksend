import { createHmac } from 'crypto';
import type { Consumer, Producer } from 'kafkajs';
import { markUp, markDown } from '../lib/health.js';
import { Topics, buildSegmentContactFilter } from '@bulksend/shared';
import type { CampaignDispatchPayload, EmailSendPayload, RawFilter } from '@bulksend/shared';
import { prisma } from '../db/client.js';
import { redis } from '../redis/client.js';
import { logger } from '../lib/logger.js';
import { env } from '../lib/env.js';

function unsubscribeUrl(workspaceId: string, email: string): string {
  const token = createHmac('sha256', env.TRACKING_SECRET)
    .update(`${workspaceId}:${email}`)
    .digest('base64url');
  return `${env.APP_URL}/t/u/${workspaceId}/${encodeURIComponent(email)}?token=${token}`;
}

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

  consumer.on(consumer.events.CRASH, () => markDown('dispatcher'));
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

        const rawFilters = segment?.filters;
        const segmentFilters = rawFilters
          ? ((Array.isArray(rawFilters) ? rawFilters : typeof rawFilters === 'string' ? JSON.parse(rawFilters) : []) as RawFilter[])
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

          // Fetch real send IDs — handles replay where sends already exist
          const sends = await prisma.send.findMany({
            where: { campaignId, contactId: { in: contacts.map(c => c.id) } },
            select: { id: true, contactId: true },
          });
          const sendIdByContactId = new Map(sends.map(s => [s.contactId, s.id]));

          for (const contact of contacts) {
            const sendId = sendIdByContactId.get(contact.id);
            if (!sendId) {
              log.error({ contactId: contact.id }, 'No send record found after insert, skipping');
              continue;
            }
            const sendPayload: EmailSendPayload = {
              sendId,
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
                unsubscribe_url: unsubscribeUrl(workspaceId, contact.email),
              },
              attempt: 1,
              idempotencyKey: `${campaignId}:${contact.id}:1`,
            };

            allMessages.push({ key: contact.id, value: JSON.stringify(sendPayload) });
          }

          cursor = contacts.at(-1)?.id;
          totalFannedOut = allMessages.length;
        } while (true);

        // Seed counter before produce to prevent race where all workers finish before counter is set.
        // If produce fails, delete the key so it is reset correctly on retry.
        await redis.set(remainingKey(campaignId), totalFannedOut);

        try {
          await producer.send({ topic: Topics.EMAIL_SEND, messages: allMessages });
        } catch (err) {
          await redis.del(remainingKey(campaignId));
          throw err;
        }

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
  markUp('dispatcher');
}
