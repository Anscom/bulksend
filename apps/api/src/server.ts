import './lib/env.js'; // Validate env vars first — fail fast
import { createApp } from './app.js';
import { env } from './lib/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './db/client.js';
import { disconnectProducer } from './kafka/producer.js';

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'BulkSend API started');
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'Graceful shutdown initiated');
  server.close(async () => {
    try {
      await Promise.all([
        prisma.$disconnect(),
        disconnectProducer(),
      ]);
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Shutdown error');
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
