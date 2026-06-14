import { prisma } from '../db/client.js';
import type { EventType } from '@bulksend/shared';

export interface EventRow {
  id: string;
  type: EventType;
  occurredAt: Date;
  campaignId: string;
  campaignName: string;
  contactEmail: string;
  contactFirstName: string | null;
  contactLastName: string | null;
}

export interface EventsPage {
  items: EventRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listEvents(
  workspaceId: string,
  opts: { page?: number; pageSize?: number; type?: EventType | null } = {},
): Promise<EventsPage> {
  const page     = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 50));
  const skip     = (page - 1) * pageSize;

  const where = {
    workspaceId,
    ...(opts.type ? { type: opts.type } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.emailEvent.count({ where }),
    prisma.emailEvent.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        type: true,
        occurredAt: true,
        campaignId: true,
        campaign: { select: { name: true } },
        send: {
          select: {
            contact: { select: { email: true, firstName: true, lastName: true } },
          },
        },
      },
    }),
  ]);

  const items: EventRow[] = rows.map(r => ({
    id: r.id,
    type: r.type as EventType,
    occurredAt: r.occurredAt,
    campaignId: r.campaignId,
    campaignName: r.campaign.name,
    contactEmail: r.send.contact.email,
    contactFirstName: r.send.contact.firstName,
    contactLastName: r.send.contact.lastName,
  }));

  return { items, total, page, pageSize };
}
