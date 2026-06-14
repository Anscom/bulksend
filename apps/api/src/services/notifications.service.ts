import { prisma } from '../db/client.js';

export type NotificationType = 'campaign_sent' | 'campaign_failed' | 'campaign_scheduled';

export async function createNotification(
  workspaceId: string,
  type: NotificationType,
  title: string,
  body: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await prisma.notification.create({
    data: { workspaceId, type, title, body, metadata: metadata as object },
  });
}

export async function listNotifications(workspaceId: string) {
  return prisma.notification.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getUnreadCount(workspaceId: string): Promise<number> {
  return prisma.notification.count({ where: { workspaceId, read: false } });
}

export async function markAllRead(workspaceId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { workspaceId, read: false },
    data: { read: true },
  });
}

export async function deleteNotification(id: string, workspaceId: string): Promise<void> {
  await prisma.notification.deleteMany({ where: { id, workspaceId } });
}
