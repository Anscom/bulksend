import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  KAFKA_BROKERS: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  SENDGRID_API_KEY: z.string().min(1),
  TRACKING_SECRET: z.string().default('dev-tracking-secret'),
  SENDGRID_WEBHOOK_SECRET: z.string().default('dev-webhook-secret'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Missing or invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
