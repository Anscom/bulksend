import { Kafka, type KafkaConfig } from 'kafkajs';
import { env } from '../lib/env.js';

const config: KafkaConfig = {
  clientId: 'bulksend-worker',
  brokers: env.KAFKA_BROKERS.split(','),
  retry: { retries: 10, initialRetryTime: 300, maxRetryTime: 30000 },
  ssl: env.KAFKA_SSL === 'true',
  ...(env.KAFKA_SASL_USERNAME && {
    sasl: {
      mechanism: 'scram-sha-256',
      username: env.KAFKA_SASL_USERNAME,
      password: env.KAFKA_SASL_PASSWORD,
    },
  }),
};

export const kafka = new Kafka(config);
