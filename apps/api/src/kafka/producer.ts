import { Kafka, type Producer } from 'kafkajs';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';

const kafka = new Kafka({
  clientId: 'bulksend-api',
  brokers: env.KAFKA_BROKERS.split(','),
  retry: { retries: 5 },
});

let _producer: Producer | null = null;

export async function getProducer(): Promise<Producer> {
  if (_producer) return _producer;
  _producer = kafka.producer({ idempotent: true });
  await _producer.connect();
  logger.info('Kafka producer connected');
  return _producer;
}

export async function disconnectProducer(): Promise<void> {
  if (_producer) {
    await _producer.disconnect();
    _producer = null;
  }
}
