import type { Producer } from 'kafkajs';
import { Topics } from '@bulksend/shared';
import type { EmailSendPayload, EmailSendRetryPayload, EmailSendDlqPayload } from '@bulksend/shared';
import type { ErrorKind } from '../lib/errors.js';

const RETRY_TOPICS = [
  Topics.EMAIL_SEND_RETRY_1,
  Topics.EMAIL_SEND_RETRY_2,
  Topics.EMAIL_SEND_RETRY_3,
] as const;

const RETRY_DELAYS_MS = [5_000, 60_000, 900_000]; // 5s, 1m, 15m

export async function routeToRetry(
  producer: Producer,
  payload: EmailSendPayload,
  kind: ErrorKind,
  error: string,
): Promise<void> {
  const attempt = payload.attempt; // 1-indexed, already incremented before this call

  if (kind === 'permanent' || attempt > 3) {
    // DLQ — log and move on
    const dlqPayload: EmailSendDlqPayload = {
      ...payload,
      errorTrail: [{ attempt, error, occurredAt: new Date().toISOString() }],
      exhaustedAt: new Date().toISOString(),
    };
    await producer.send({
      topic: Topics.EMAIL_SEND_DLQ,
      messages: [{ key: payload.sendId, value: JSON.stringify(dlqPayload) }],
    });
    return;
  }

  const retryTopic = RETRY_TOPICS[attempt - 1]!;
  const delayMs = RETRY_DELAYS_MS[attempt - 1] ?? 900_000;

  const retryPayload: EmailSendRetryPayload = {
    ...payload,
    availableAt: new Date(Date.now() + delayMs).toISOString(),
    lastError: error,
    lastAttemptAt: new Date().toISOString(),
  };

  await producer.send({
    topic: retryTopic,
    messages: [{ key: payload.sendId, value: JSON.stringify(retryPayload) }],
  });
}
