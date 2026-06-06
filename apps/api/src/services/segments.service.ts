import { prisma } from '../db/client.js';
import { Errors } from '../lib/errors.js';
import type { Segment, CreateSegmentRequest } from '@bulksend/shared';

export async function listSegments(workspaceId: string): Promise<Segment[]> {
  const segments = await prisma.segment.findMany({ where: { workspaceId }, orderBy: { name: 'asc' } });
  return segments as unknown as Segment[];
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
    data: { ...data, workspaceId, contactCount: count, filters: JSON.stringify(data.filters) },
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
      ...(data.filters ? { filters: JSON.stringify(data.filters), contactCount: count } : {}),
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

async function countSegmentContacts(
  workspaceId: string,
  filters: CreateSegmentRequest['filters'],
): Promise<number> {
  // Simplified: count subscribed contacts matching status filter
  // In production, build a dynamic Prisma where clause from the filter DSL
  return prisma.contact.count({
    where: { workspaceId, status: 'subscribed', deletedAt: null },
  });
}
