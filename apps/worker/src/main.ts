import './lib/env.js';
import http from 'node:http';
import { kafka } from './kafka/client.js';
import { Topics, CONSUMER_GROUPS } from '@bulksend/shared';
import { startDispatcher } from './consumers/dispatcher.js';
import { startSender } from './consumers/sender.js';
import { startEventWorker } from './consumers/event-worker.js';
import { startDlqMonitor } from './consumers/dlq-monitor.js';
import { startScheduler } from './lib/scheduler.js';
import { allHealthy, healthState } from './lib/health.js';
import { prisma } from './db/client.js';
import { logger } from './lib/logger.js';
import { env } from './lib/env.js';

const suffix = env.KAFKA_GROUP_ID_SUFFIX;
const gid = (base: string) => suffix ? `${base}-${suffix}` : base;

async function main() {
  logger.info('BulkSend worker starting');

  const producer = kafka.producer({ idempotent: true });
  await producer.connect();
  logger.info('Kafka producer connected');

  const dispatcConsumer = kafka.consumer({
    groupId: gid(CONSUMER_GROUPS.DISPATCH_WORKERS),
    sessionTimeout: 30000,
    rebalanceTimeout: 60000,
  });

  const sendConsumer = kafka.consumer({
    groupId: gid(CONSUMER_GROUPS.SEND_WORKERS),
    sessionTimeout: 30000,
    maxWaitTimeInMs: 100,
  });

  const eventConsumer = kafka.consumer({
    groupId: gid(CONSUMER_GROUPS.EVENT_WORKERS),
    sessionTimeout: 30000,
  });

  const dlqConsumer = kafka.consumer({
    groupId: gid(CONSUMER_GROUPS.DLQ_MONITOR),
  });

  await Promise.all([
    startDispatcher(dispatcConsumer, producer),
    startSender(sendConsumer, producer, [
      Topics.EMAIL_SEND,
      Topics.EMAIL_SEND_RETRY_1,
      Topics.EMAIL_SEND_RETRY_2,
      Topics.EMAIL_SEND_RETRY_3,
    ]),
    startEventWorker(eventConsumer),
    startDlqMonitor(dlqConsumer),
  ]);

  const stopScheduler = startScheduler(producer);
  logger.info('All consumers running');

  // Health check server — uses WORKER_PORT to avoid conflicting with the API's PORT=3001
  const port = process.env['WORKER_PORT'] ?? process.env['PORT'] ?? 3002;
  const healthServer = http.createServer((_req, res) => {
    const healthy = allHealthy();
    res.writeHead(healthy ? 200 : 503).end(
      JSON.stringify({ ok: healthy, service: 'worker', consumers: healthState() }),
    );
  });
  healthServer.listen(port, () => logger.info({ port }, 'Worker health server listening'));

  async function shutdown(signal: string) {
    logger.info({ signal }, 'Graceful shutdown');
    stopScheduler();
    await Promise.all([
      dispatcConsumer.disconnect(),
      sendConsumer.disconnect(),
      eventConsumer.disconnect(),
      dlqConsumer.disconnect(),
      producer.disconnect(),
      prisma.$disconnect(),
    ]);
    logger.info('Worker shutdown complete');
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Worker startup error');
  process.exit(1);
});
