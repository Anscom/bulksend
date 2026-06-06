import type { Consumer } from 'kafkajs';
import { Topics } from '@bulksend/shared';
import type { EmailSendDlqPayload } from '@bulksend/shared';
import { logger } from '../lib/logger.js';

/**
 * DLQ monitor — logs exhausted sends with full error trail.
 * In production, extend this to alert via PagerDuty / Slack.
 */
export async function startDlqMonitor(consumer: Consumer): Promise<void> {
  await consumer.connect();
  await consumer.subscribe({ topic: Topics.EMAIL_SEND_DLQ, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
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
      // TODO: alert on DLQ depth threshold
    },
  });
}
