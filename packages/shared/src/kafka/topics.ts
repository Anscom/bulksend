// Single source of truth for all Kafka topic names.
// Both api (producer) and worker (consumer) import from here.

export const Topics = {
  CAMPAIGN_DISPATCH: 'campaign.dispatch',
  EMAIL_SEND: 'email.send',
  EMAIL_SEND_RETRY_1: 'email.send.retry.1',
  EMAIL_SEND_RETRY_2: 'email.send.retry.2',
  EMAIL_SEND_RETRY_3: 'email.send.retry.3',
  EMAIL_SEND_DLQ: 'email.send.dlq',
  EMAIL_EVENTS: 'email.events',
} as const;

export type TopicName = (typeof Topics)[keyof typeof Topics];

export const PARTITIONS: Record<TopicName, number> = {
  [Topics.CAMPAIGN_DISPATCH]: 6,
  [Topics.EMAIL_SEND]: 12,
  [Topics.EMAIL_SEND_RETRY_1]: 6,
  [Topics.EMAIL_SEND_RETRY_2]: 6,
  [Topics.EMAIL_SEND_RETRY_3]: 6,
  [Topics.EMAIL_SEND_DLQ]: 3,
  [Topics.EMAIL_EVENTS]: 12,
};

export const CONSUMER_GROUPS = {
  DISPATCH_WORKERS: 'dispatch-workers',
  SEND_WORKERS: 'send-workers',
  RETRY_SCHEDULER: 'retry-scheduler',
  EVENT_WORKERS: 'event-workers',
  DLQ_MONITOR: 'dlq-monitor',
} as const;
