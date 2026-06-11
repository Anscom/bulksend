import { prisma } from '../db/client.js';
import { redis } from '../redis/client.js';
import { suppKey } from '../redis/keys.js';

export async function recordOpen(sendId: string, userAgent: string | undefined, ip: string | undefined) {
  await prisma.emailEvent.create({
    data: {
      sendId,
      type: 'opened',
      metadata: { userAgent, ip },
      occurredAt: new Date(),
      // workspaceId / campaignId hydrated by the worker via sendId lookup
      workspaceId: '',
      campaignId: '',
    },
  });
}

export async function recordClick(sendId: string, url: string, userAgent: string | undefined) {
  await prisma.emailEvent.create({
    data: {
      sendId,
      type: 'clicked',
      metadata: { url, userAgent },
      occurredAt: new Date(),
      workspaceId: '',
      campaignId: '',
    },
  });
}

export async function unsubscribeContact(workspaceId: string, email: string) {
  await Promise.all([
    prisma.contact.updateMany({
      where: { workspaceId, email, deletedAt: null },
      data: { status: 'unsubscribed' },
    }),
    redis.sadd(suppKey(workspaceId), email),
  ]);
}
