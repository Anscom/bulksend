import type { Contact, Segment, SegmentFilter, PlanTier, User, MemberRole } from '@bulksend/shared';
import type { Prisma } from '@prisma/client';

type PrismaContact = Prisma.ContactGetPayload<Record<never, never>>;
type PrismaSegment = Prisma.SegmentGetPayload<Record<never, never>>;

export function toContact(raw: PrismaContact): Contact {
  return { ...raw, attributes: raw.attributes as Record<string, unknown> };
}

export function parseFilters(value: Prisma.JsonValue): SegmentFilter[] {
  if (Array.isArray(value)) return value as unknown as SegmentFilter[];
  if (typeof value === 'string') return JSON.parse(value) as SegmentFilter[];
  return [];
}

export function toSegment(raw: PrismaSegment): Segment {
  return { ...raw, filters: parseFilters(raw.filters) };
}

export function toWorkspace<T extends { plan: string }>(raw: T): Omit<T, 'plan'> & { plan: PlanTier } {
  return { ...raw, plan: raw.plan as PlanTier };
}

export function toUser<T extends { role: string }>(raw: T): Omit<T, 'role'> & { role: MemberRole } {
  return { ...raw, role: raw.role as MemberRole };
}
