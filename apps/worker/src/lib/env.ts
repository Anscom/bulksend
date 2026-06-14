import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().min(1),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  KAFKA_BROKERS: z.string().min(1),
  KAFKA_SASL_USERNAME: z.string().default(''),
  KAFKA_SASL_PASSWORD: z.string().default(''),
  KAFKA_SSL: z.string().default('false'),
  BREVO_API_KEY: z.string().min(1),
  KAFKA_GROUP_ID_SUFFIX: z.string().default(''),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Missing or invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
