import { prisma } from '../db/client.js';
import type { AnalyticsOverview, VolumePoint } from '@bulksend/shared';

const WINDOW_DAYS = 30;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function trend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getOverview(workspaceId: string): Promise<AnalyticsOverview> {
  const currStart = daysAgo(WINDOW_DAYS);
  const prevStart = daysAgo(WINDOW_DAYS * 2);
  const prevEnd   = currStart;

  const [
    currSent,
    prevSent,
    currDelivered,
    prevDelivered,
    currOpened,
    prevOpened,
    activeContacts,
    prevActiveContacts,
  ] = await Promise.all([
    prisma.send.count({
      where: { workspaceId, createdAt: { gte: currStart } },
    }),
    prisma.send.count({
      where: { workspaceId, createdAt: { gte: prevStart, lt: prevEnd } },
    }),
    prisma.emailEvent.count({
      where: { workspaceId, type: 'delivered', occurredAt: { gte: currStart } },
    }),
    prisma.emailEvent.count({
      where: { workspaceId, type: 'delivered', occurredAt: { gte: prevStart, lt: prevEnd } },
    }),
    prisma.emailEvent.count({
      where: { workspaceId, type: 'opened', occurredAt: { gte: currStart } },
    }),
    prisma.emailEvent.count({
      where: { workspaceId, type: 'opened', occurredAt: { gte: prevStart, lt: prevEnd } },
    }),
    prisma.contact.count({
      where: { workspaceId, status: 'subscribed', deletedAt: null },
    }),
    // Approximate previous active contacts as those created before the current window
    prisma.contact.count({
      where: { workspaceId, status: 'subscribed', deletedAt: null, createdAt: { lt: currStart } },
    }),
  ]);

  const currDeliveryRate = pct(currDelivered, currSent);
  const prevDeliveryRate = pct(prevDelivered, prevSent);
  const currOpenRate     = pct(currOpened, currDelivered);
  const prevOpenRate     = pct(prevOpened, prevDelivered);

  return {
    totalSent:       currSent,
    deliveryRate:    currDeliveryRate,
    openRate:        currOpenRate,
    activeContacts,
    sentTrend:       trend(currSent, prevSent),
    deliveryTrend:   trend(currDeliveryRate, prevDeliveryRate),
    openTrend:       trend(currOpenRate, prevOpenRate),
    contactsTrend:   trend(activeContacts, prevActiveContacts),
  };
}

export interface UsageStats {
  sendsThisHour: number;
  planLimit: number;
  minutesUntilReset: number;
}

export async function getUsage(workspaceId: string): Promise<UsageStats> {
  const now = new Date();
  const hourStart = new Date(now);
  hourStart.setMinutes(0, 0, 0);

  const [workspace, sendsThisHour] = await Promise.all([
    prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { sendRatePerHour: true } }),
    prisma.send.count({ where: { workspaceId, createdAt: { gte: hourStart } } }),
  ]);

  const minutesUntilReset = 60 - now.getMinutes();

  return { sendsThisHour, planLimit: workspace.sendRatePerHour, minutesUntilReset };
}

export interface CampaignPerformanceRow {
  id: string;
  name: string;
  status: string;
  sentAt: Date | null;
  totalRecipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export async function getCampaignPerformance(workspaceId: string, limit = 20): Promise<CampaignPerformanceRow[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { workspaceId, status: { in: ['sent', 'sending', 'paused'] } },
    orderBy: { sentAt: 'desc' },
    take: limit,
    select: { id: true, name: true, status: true, sentAt: true, totalRecipients: true },
  });

  if (campaigns.length === 0) return [];

  const ids = campaigns.map(c => c.id);
  const eventCounts = await prisma.emailEvent.groupBy({
    by: ['campaignId', 'type'],
    where: { workspaceId, campaignId: { in: ids } },
    _count: { id: true },
  });

  const byId: Record<string, Record<string, number>> = {};
  for (const r of eventCounts) {
    (byId[r.campaignId] ??= {})[r.type] = r._count.id;
  }

  return campaigns.map(c => {
    const ec = byId[c.id] ?? {};
    const delivered = ec['delivered'] ?? 0;
    const opened    = ec['opened']    ?? 0;
    const clicked   = ec['clicked']   ?? 0;
    const bounced   = ec['bounced']   ?? 0;
    const sent      = c.totalRecipients;
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      sentAt: c.sentAt,
      totalRecipients: c.totalRecipients,
      delivered,
      opened,
      clicked,
      bounced,
      openRate:    sent > 0 ? Math.round((opened / sent) * 100) : 0,
      clickRate:   sent > 0 ? Math.round((clicked / sent) * 100) : 0,
      bounceRate:  sent > 0 ? Math.round((bounced / sent) * 100) : 0,
    };
  });
}

type RawVolumeRow = { date: Date; count: bigint };

export async function getVolume(workspaceId: string, days = 30): Promise<VolumePoint[]> {
  const since = daysAgo(days);

  const [deliveredRows, openedRows] = await Promise.all([
    prisma.$queryRaw<RawVolumeRow[]>`
      SELECT DATE_TRUNC('day', occurred_at) AS date, COUNT(*)::bigint AS count
      FROM email_events
      WHERE workspace_id = ${workspaceId}::uuid
        AND type = 'delivered'
        AND occurred_at >= ${since}
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<RawVolumeRow[]>`
      SELECT DATE_TRUNC('day', occurred_at) AS date, COUNT(*)::bigint AS count
      FROM email_events
      WHERE workspace_id = ${workspaceId}::uuid
        AND type = 'opened'
        AND occurred_at >= ${since}
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  const toKey = (d: Date) => d.toISOString().slice(0, 10);
  const deliveredMap = new Map(deliveredRows.map(r => [toKey(r.date), Number(r.count)]));
  const openedMap    = new Map(openedRows.map(r => [toKey(r.date), Number(r.count)]));

  const points: VolumePoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = toKey(daysAgo(i));
    points.push({
      date,
      delivered: deliveredMap.get(date) ?? 0,
      opened:    openedMap.get(date)    ?? 0,
    });
  }

  return points;
}
