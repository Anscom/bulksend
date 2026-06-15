import { prisma } from '../db/client.js';
import { getProducer } from '../kafka/producer.js';
import { Topics } from '../kafka/topics.js';
import type { EmailEventPayload } from '@bulksend/shared';

async function resolveSendIds(providerMessageId: string): Promise<{ sendId: string; campaignId: string; workspaceId: string; contactId: string } | null> {
  const send = await prisma.send.findUnique({
    where: { providerMessageId },
    select: { id: true, campaignId: true, workspaceId: true, contactId: true },
  });
  if (!send) return null;
  return { sendId: send.id, campaignId: send.campaignId, workspaceId: send.workspaceId, contactId: send.contactId };
}

/**
 * Handles incoming Brevo delivery events (webhook).
 * Normalizes them and produces to email.events for async DB writes.
 */
export async function processBrevoWebhook(
  events: Array<Record<string, unknown>>,
): Promise<void> {
  const producer = await getProducer();

  const messages: Array<{ key: string; value: string }> = [];

  for (const raw of events) {
    const type = mapBrevoEvent(String(raw['event'] ?? ''));
    if (!type) continue;

    const providerMessageId = String(raw['messageId'] ?? '');
    const providerEventId = String(raw['ts_epoch'] ?? raw['ts'] ?? Date.now());
    const occurredAt = raw['ts_epoch']
      ? new Date(Number(raw['ts_epoch'])).toISOString()
      : new Date(Number(raw['ts'] ?? 0) * 1000).toISOString();

    const ids = providerMessageId ? await resolveSendIds(providerMessageId) : null;

    messages.push({
      key: providerMessageId,
      value: JSON.stringify({
        sendId: ids?.sendId ?? '',
        campaignId: ids?.campaignId ?? '',
        workspaceId: ids?.workspaceId ?? '',
        contactId: ids?.contactId ?? '',
        type,
        providerEventId,
        metadata: raw,
        occurredAt,
        providerMessageId,
      }),
    });
  }

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
