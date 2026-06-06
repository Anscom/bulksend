import { Kafka } from 'kafkajs';
import { env } from '../lib/env.js';

export const kafka = new Kafka({
  clientId: 'bulksend-worker',
  brokers: env.KAFKA_BROKERS.split(','),
  retry: { retries: 10, initialRetryTime: 300, maxRetryTime: 30000 },
});
