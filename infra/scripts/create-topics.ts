/**
 * Creates all Kafka topics in Redpanda Cloud (or any Kafka-compatible broker).
 * Run once after creating your Redpanda cluster:
 *
 *   cd apps/api
 *   KAFKA_BROKERS=... KAFKA_SASL_USERNAME=... KAFKA_SASL_PASSWORD=... KAFKA_SSL=true \
 *     npx tsx ../../infra/scripts/create-topics.ts
 */
import { Kafka, type KafkaConfig } from 'kafkajs';

const brokers = (process.env['KAFKA_BROKERS'] ?? 'localhost:9092').split(',');
const username = process.env['KAFKA_SASL_USERNAME'] ?? '';
const password = process.env['KAFKA_SASL_PASSWORD'] ?? '';
const ssl = process.env['KAFKA_SSL'] === 'true';

const config: KafkaConfig = {
  clientId: 'bulksend-admin',
  brokers,
  ssl,
  ...(username && {
    sasl: { mechanism: 'scram-sha-256', username, password },
  }),
};

const kafka = new Kafka(config);
const admin = kafka.admin();

// Redpanda Cloud Serverless requires replicationFactor: 3
const TOPICS = [
  { topic: 'campaign.dispatch',    numPartitions: 6,  replicationFactor: 3 },
  { topic: 'email.send',           numPartitions: 12, replicationFactor: 3 },
  { topic: 'email.send.retry.1',   numPartitions: 6,  replicationFactor: 3 },
  { topic: 'email.send.retry.2',   numPartitions: 6,  replicationFactor: 3 },
  { topic: 'email.send.retry.3',   numPartitions: 6,  replicationFactor: 3 },
  { topic: 'email.send.dlq',       numPartitions: 3,  replicationFactor: 3 },
  { topic: 'email.events',         numPartitions: 12, replicationFactor: 3 },
];

async function main() {
  await admin.connect();
  console.log('Connected to Kafka broker');

  const existing = new Set(await admin.listTopics());
  const toCreate = TOPICS.filter(t => !existing.has(t.topic));

  if (toCreate.length === 0) {
    console.log('All topics already exist — nothing to do.');
  } else {
    await admin.createTopics({ topics: toCreate, waitForLeaders: true });
    for (const t of toCreate) {
      console.log(`✓ Created ${t.topic} (${t.numPartitions} partitions)`);
    }
  }

  await admin.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
