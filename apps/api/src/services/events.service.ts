import { prisma } from '../db/client.js';
import { getProducer } from '../kafka/producer.js';
import { Topics } from '../kafka/topics.js';
import type { EmailEventPayload } from '@bulksend/shared';

/**
 * Handles incoming Brevo delivery events (webhook).
 * Normalizes them and produces to email.events for async DB writes.
 */
export async function processBrevoWebhook(
  events: Array<Record<string, unknown>>,
): Promise<void> {
  const producer = await getProducer();

  const messages = events
    .map((raw) => {
      const type = mapBrevoEvent(String(raw['event'] ?? ''));
      if (!type) return null;

      const providerMessageId = String(raw['messageId'] ?? '');
      const providerEventId = String(raw['ts_epoch'] ?? raw['ts'] ?? Date.now());

      return {
        key: providerMessageId,
        value: JSON.stringify({
          sendId: '',
          campaignId: '',
          workspaceId: '',
          contactId: '',
          type,
          providerEventId,
          metadata: raw,
          occurredAt: raw['ts_epoch']
            ? new Date(Number(raw['ts_epoch'])).toISOString()
            : new Date(Number(raw['ts'] ?? 0) * 1000).toISOString(),
          providerMessageId,
        }),
      };
    })
    .filter(Boolean) as Array<{ key: string; value: string }>;

  if (messages.length === 0) return;

  await producer.send({ topic: Topics.EMAIL_EVENTS, messages });
}

function mapBrevoEvent(event: string): EmailEventPayload['type'] | null {
  const map: Record<string, EmailEventPayload['type']> = {
    delivered:    'delivered',
    opened:       'opened',
    clicked:      'clicked',
    hardBounce:   'bounced',
    softBounce:   'bounced',
    unsubscribed: 'unsubscribed',
    spamReported: 'spam',
  };
  return map[event] ?? null;
}
