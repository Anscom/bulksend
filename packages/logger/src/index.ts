import pino, { type Logger, type LoggerOptions } from 'pino';

const isDev = process.env['NODE_ENV'] !== 'production';

const baseOptions: LoggerOptions = {
  level: process.env['LOG_LEVEL'] ?? (isDev ? 'debug' : 'info'),
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        // Production: structured JSON — GCP Cloud Logging ingests this natively.
        // The `requestId` field threads through from HTTP middleware.
        formatters: {
          level(label) {
            return { severity: label.toUpperCase() };
          },
        },
        messageKey: 'message',
      }),
};

/**
 * Create a child logger tagged with the service name.
 * Each Cloud Run service calls this once at startup.
 *
 * Usage:
 *   import { createLogger } from '@bulksend/logger';
 *   const logger = createLogger('api');
 *   logger.info({ requestId }, 'handled request');
 */
export function createLogger(service: string): Logger {
  return pino(baseOptions).child({ service });
}

export type { Logger };
