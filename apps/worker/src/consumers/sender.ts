import type { Consumer, Producer } from 'kafkajs';
import { markUp, markDown } from '../lib/health.js';
import { Topics } from '@bulksend/shared';
import type { EmailSendPayload, EmailSendRetryPayload } from '@bulksend/shared';
import { prisma } from '../db/client.js';
import { sendEmail } from '../services/brevo.js';
import { isSuppressed } from '../services/suppression.js';
import { acquireToken } from '../services/rate-limiter.js';
import { decrementAndCheck } from '../services/completion.js';
import { routeToRetry } from '../kafka/retry.js';
import { classifyError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export async function startSender(
  consumer: Consumer,
  producer: Producer,
  topics: string[],
): Promise<void> {
  await consumer.connect();
  await consumer.subscribe({ topics, fromBeginning: false });

  consumer.on(consumer.events.CRASH, () => markDown('sender'));
  await consumer.run({
    autoCommit: false,
    partitionsConsumedConcurrently: 4,
    eachMessage: async ({ message, partition, topic }) => {
      const raw = JSON.parse(message.value!.toString()) as EmailSendPayload | EmailSendRetryPayload;

      // Retry topics: skip until availableAt
      if ('availableAt' in raw && raw.availableAt) {
        const delayMs = new Date(raw.availableAt).getTime() - Date.now();
        if (delayMs > 0) {
          // Pause partition for the actual remaining delay (capped at 30s so we re-check regularly).
          // Don't commit offset — message will be re-read when the partition resumes.
          const pauseDuration = Math.min(delayMs, 30_000);
          consumer.pause([{ topic, partitions: [partition] }]);
          setTimeout(() => consumer.resume([{ topic, partitions: [partition] }]), pauseDuration);
          return;
        }
      }

      await handleSend(raw as EmailSendPayload, producer, topic, partition, message.offset, consumer);
    },
  });
  markUp('sender');
}

async function handleSend(
  payload: EmailSendPayload,
  producer: Producer,
  topic: string,
  partition: number,
  offset: string,
  consumer: Consumer,
): Promise<void> {
  const log = logger.child({ sendId: payload.sendId, campaignId: payload.campaignId });

  // 1. Idempotency check — was this already sent?
  const existingSend = await prisma.send.findFirst({
    where: { campaignId: payload.campaignId, contactId: payload.contactId, status: { not: 'pending' } },
  });
  if (existingSend) {
    log.debug('Send already processed, skipping');
    await commitOffset(consumer, topic, partition, offset);
    return;
  }

  // 2. Suppression check
  const suppressed = await isSuppressed(payload.workspaceId, payload.email);
  if (suppressed) {
    log.debug('Contact suppressed, skipping');
    await finalizeSend(payload, 'unsubscribed', null);
    await decrementAndCheck(payload.campaignId, payload.workspaceId);
    await commitOffset(consumer, topic, partition, offset);
    return;
  }

  // 3. Rate limit check
  const workspace = await prisma.workspace.findUnique({
    where: { id: payload.workspaceId },
    select: { sendRatePerHour: true, brevoApiKey: true },
  });
  const ratePerMinute = Math.ceil((workspace?.sendRatePerHour ?? 100) / 60);
  const hasToken = await acquireToken(payload.workspaceId, ratePerMinute);

  if (!hasToken) {
    // Requeue without burning an attempt
    log.warn('Rate limited, requeueing');
    await producer.send({
      topic: Topics.EMAIL_SEND_RETRY_1,
      messages: [{
        key: payload.sendId,
        value: JSON.stringify({
          ...payload,
          availableAt: new Date(Date.now() + 5_000).toISOString(),
          lastError: 'rate_limited',
          lastAttemptAt: new Date().toISOString(),
        }),
      }],
    });
    await commitOffset(consumer, topic, partition, offset);
    return;
  }

  // 4. Send via Brevo
  try {
    const result = await sendEmail(payload, workspace?.brevoApiKey);
    await finalizeSend(payload, 'sent', result.providerMessageId);
    await decrementAndCheck(payload.campaignId, payload.workspaceId);
    log.info('Email sent successfully');
  } catch (err) {
    const kind = classifyError(err);

    if (kind === 'auth') {
      // API key is invalid — fail the entire campaign immediately so the UI shows
      // 'failed' rather than eventually transitioning to 'sent' with 0 deliveries.
      log.error(
        { campaignId: payload.campaignId },
        'Brevo API key rejected (401/403) — check BREVO_API_KEY, marking campaign failed',
      );
      const updated = await prisma.campaign.updateMany({
        where: { id: payload.campaignId, status: 'sending' },
        data: { status: 'failed' },
      });
      if (updated.count > 0) {
        const campaign = await prisma.campaign.findUnique({
          where: { id: payload.campaignId },
          select: { name: true, workspaceId: true },
        });
        if (campaign) {
          await prisma.notification.create({
            data: {
              workspaceId: campaign.workspaceId,
              type: 'campaign_failed',
              title: 'Campaign failed',
              body: `"${campaign.name}" could not be sent. Check your Brevo API key in Settings.`,
              metadata: { campaignId: payload.campaignId },
            },
          });
        }
      }
      await finalizeSend(payload, 'failed', null);
      // Do not decrement: campaign is already failed; remaining queued messages
      // will also hit 401, hit the same updateMany (idempotent), and mark their sends failed.
    } else {
      log.warn({ err, kind, attempt: payload.attempt }, 'Send failed');
      if (kind === 'permanent') {
        await finalizeSend(payload, 'failed', null);
        await decrementAndCheck(payload.campaignId, payload.workspaceId);
      } else {
        await routeToRetry(producer, { ...payload, attempt: payload.attempt + 1 }, kind, String(err));
      }
    }
  }

  await commitOffset(consumer, topic, partition, offset);
}

async function finalizeSend(
  payload: EmailSendPayload,
  status: 'sent' | 'failed' | 'unsubscribed',
  providerMessageId: string | null,
): Promise<void> {
  await prisma.send.updateMany({
    where: { campaignId: payload.campaignId, contactId: payload.contactId, status: 'pending' },
    data: { status, providerMessageId, ...(status === 'sent' ? { sentAt: new Date() } : {}) },
  });
}

async function commitOffset(
  consumer: Consumer,
  topic: string,
  partition: number,
  offset: string,
): Promise<void> {
  await consumer.commitOffsets([{ topic, partition, offset: (BigInt(offset) + 1n).toString() }]);
}
