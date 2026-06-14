export interface RawFilter {
  field: string;
  operator: string;
  value: unknown;
}

const STRING_FIELDS = new Set(['email', 'firstName', 'lastName']);

/**
 * Builds a Prisma-compatible where clause for Contact queries from a segment's filter DSL.
 * Always includes workspaceId and deletedAt: null for safety.
 * Does NOT enforce status: 'subscribed' — callers that send email must add that themselves.
 */
export function buildSegmentContactFilter(
  workspaceId: string,
  filters: RawFilter[],
): Record<string, unknown> {
  const base: Record<string, unknown> = { workspaceId, deletedAt: null };

  if (!filters || filters.length === 0) return base;

  const conditions: Record<string, unknown>[] = [];

  for (const { field, operator, value } of filters) {
    const cond = buildCondition(field, operator, value);
    if (cond !== null) conditions.push(cond);
  }

  if (conditions.length === 0) return base;
  return { ...base, AND: conditions };
}

function buildCondition(
  field: string,
  operator: string,
  value: unknown,
): Record<string, unknown> | null {
  if (field === 'status') {
    switch (operator) {
      case 'eq':  return { status: value };
      case 'neq': return { status: { not: value } };
      case 'in':  return { status: { in: value } };
    }
  }

  if (STRING_FIELDS.has(field)) {
    switch (operator) {
      case 'eq':       return { [field]: { equals: value, mode: 'insensitive' } };
      case 'neq':      return { [field]: { not: value } };
      case 'contains': return { [field]: { contains: value, mode: 'insensitive' } };
      case 'in':       return { [field]: { in: value } };
      case 'exists':   return { [field]: value ? { not: null } : null };
    }
  }

  if (field === 'createdAt') {
    const date = new Date(value as string);
    switch (operator) {
      case 'gt': return { createdAt: { gt: date } };
      case 'lt': return { createdAt: { lt: date } };
      case 'eq': return { createdAt: { equals: date } };
    }
  }

  return null;
}
