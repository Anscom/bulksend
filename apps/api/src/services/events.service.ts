import { prisma } from '../db/client.js';
import { getProducer } from '../kafka/producer.js';
import { Topics } from '../kafka/topics.js';
import type { EmailEventPayload } from '@bulksend/shared';

/**
 * Handles incoming SendGrid delivery events (webhook).
 * Normalizes them and produces to email.events for async DB writes.
 */
export async function processSendGridWebhook(
  events: Array<Record<string, unknown>>,
): Promise<void> {
  const producer = await getProducer();

  const messages = events
    .map((raw) => {
      const type = mapSendGridEvent(String(raw['event'] ?? ''));
      if (!type) return null;

      const providerMessageId = String(raw['sg_message_id'] ?? '');
      const providerEventId = String(raw['sg_event_id'] ?? '');

      return {
        key: providerMessageId,
        value: JSON.stringify({
          sendId: '', // resolved by worker via providerMessageId lookup
          campaignId: '',
          workspaceId: '',
          contactId: '',
          type,
          providerEventId,
          metadata: raw,
          occurredAt: new Date(Number(raw['timestamp'] ?? 0) * 1000).toISOString(),
          providerMessageId, // worker uses this to look up the send
        } satisfies Omit<EmailEventPayload, 'sendId' | 'campaignId' | 'workspaceId' | 'contactId'> & {
          providerMessageId: string;
        }),
      };
    })
    .filter(Boolean) as Array<{ key: string; value: string }>;

  if (messages.length === 0) return;

  await producer.send({ topic: Topics.EMAIL_EVENTS, messages });
}

function mapSendGridEvent(
  event: string,
): EmailEventPayload['type'] | null {
  const map: Record<string, EmailEventPayload['type']> = {
    delivered: 'delivered',
    open: 'opened',
    click: 'clicked',
    bounce: 'bounced',
    unsubscribe: 'unsubscribed',
    spamreport: 'spam',
  };
  return map[event] ?? null;
}
