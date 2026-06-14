import { prisma } from '../db/client.js';
import { Errors } from '../lib/errors.js';
import { buildSegmentContactFilter } from '@bulksend/shared';
import type { Segment, Contact, CreateSegmentRequest } from '@bulksend/shared';

export async function listSegments(
  workspaceId: string,
  page = 1,
  pageSize = 50,
): Promise<{ items: Segment[]; total: number }> {
  const where = { workspaceId };
  const [items, total] = await Promise.all([
    prisma.segment.findMany({ where, orderBy: { name: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.segment.count({ where }),
  ]);
  return { items: items as unknown as Segment[], total };
}

export async function getSegment(id: string, workspaceId: string): Promise<Segment> {
  const segment = await prisma.segment.findFirst({ where: { id, workspaceId } });
  if (!segment) throw Errors.notFound('Segment');
  return segment as unknown as Segment;
}

export async function createSegment(
  workspaceId: string,
  data: CreateSegmentRequest,
): Promise<Segment> {
  const count = await countSegmentContacts(workspaceId, data.filters);
  const segment = await prisma.segment.create({
    data: { ...data, workspaceId, contactCount: count, filters: data.filters as never },
  });
  return segment as unknown as Segment;
}

export async function updateSegment(
  id: string,
  workspaceId: string,
  data: Partial<CreateSegmentRequest>,
): Promise<Segment> {
  const segment = await prisma.segment.findFirst({ where: { id, workspaceId } });
  if (!segment) throw Errors.notFound('Segment');

  const count = data.filters ? await countSegmentContacts(workspaceId, data.filters) : undefined;
  const updated = await prisma.segment.update({
    where: { id },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.filters ? { filters: data.filters as never, contactCount: count } : {}),
    },
  });
  return updated as unknown as Segment;
}

export async function deleteSegment(id: string, workspaceId: string): Promise<void> {
  const segment = await prisma.segment.findFirst({ where: { id, workspaceId } });
  if (!segment) throw Errors.notFound('Segment');

  const inUse = await prisma.campaign.findFirst({ where: { segmentId: id } });
  if (inUse) throw Errors.conflict('Segment is used by one or more campaigns');

  await prisma.segment.delete({ where: { id } });
}

export async function getSegmentContacts(
  id: string,
  workspaceId: string,
  page: number = 1,
  pageSize: number = 50,
): Promise<{ contacts: Contact[]; total: number }> {
  const segment = await prisma.segment.findFirst({ where: { id, workspaceId } });
  if (!segment) throw Errors.notFound('Segment');

  const raw = segment.filters;
  const filters = (Array.isArray(raw) ? raw : JSON.parse(raw as unknown as string)) as CreateSegmentRequest['filters'];
  const where = buildSegmentContactFilter(workspaceId, filters);

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where: where as never,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contact.count({ where: where as never }),
  ]);

  return { contacts: contacts as unknown as Contact[], total };
}

export async function refreshSegmentCounts(workspaceId: string): Promise<void> {
  const segments = await prisma.segment.findMany({
    where: { workspaceId },
    select: { id: true, filters: true },
  });
  await Promise.all(
    segments.map(async (seg) => {
      const count = await countSegmentContacts(workspaceId, seg.filters);
      await prisma.segment.update({ where: { id: seg.id }, data: { contactCount: count } });
    }),
  );
}

async function countSegmentContacts(
  workspaceId: string,
  filters: CreateSegmentRequest['filters'] | unknown,
): Promise<number> {
  const resolved = Array.isArray(filters) ? filters : JSON.parse(filters as string);
  const where = buildSegmentContactFilter(workspaceId, resolved as CreateSegmentRequest['filters']);
  return prisma.contact.count({ where: { ...where, status: 'subscribed' } as never });
}
