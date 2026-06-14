import { Kafka, type Producer, type KafkaConfig } from 'kafkajs';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';

const config: KafkaConfig = {
  clientId: 'bulksend-api',
  brokers: env.KAFKA_BROKERS.split(','),
  retry: { retries: 5 },
  ssl: env.KAFKA_SSL === 'true',
  ...(env.KAFKA_SASL_USERNAME && {
    sasl: {
      mechanism: 'scram-sha-256',
      username: env.KAFKA_SASL_USERNAME,
      password: env.KAFKA_SASL_PASSWORD,
    },
  }),
};

const kafka = new Kafka(config);

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
