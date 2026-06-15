import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindMany = vi.fn();
const mockCount = vi.fn();

const mockPrisma = {
  contact: { findMany: mockFindMany, count: mockCount, upsert: vi.fn() },
};

vi.mock('../db/client.js', () => ({ prisma: mockPrisma }));
vi.mock('../redis/client.js', () => ({ redis: { sadd: vi.fn(), set: vi.fn(), multi: () => ({ sadd: vi.fn(), set: vi.fn(), exec: vi.fn() }) } }));
vi.mock('../services/segments.service.js', () => ({ refreshSegmentCounts: vi.fn().mockResolvedValue(undefined) }));

const { listContacts, importContacts } = await import('../services/contacts.service.js');

const makeContact = (id: string) => ({
  id,
  email: `${id}@example.com`,
  firstName: null,
  lastName: null,
  status: 'subscribed',
  attributes: {},
  workspaceId: 'ws-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockCount.mockResolvedValue(100);
});

describe('listContacts — cursor pagination', () => {
  it('passes id gt cursor when cursor provided', async () => {
    mockFindMany.mockResolvedValue([makeContact('c-2')]);

    await listContacts('ws-1', 50, undefined, undefined, 'c-1');

    const call = mockFindMany.mock.calls[0]!;
    expect(call[0].where).toMatchObject({ id: { gt: 'c-1' } });
    expect(call[0].orderBy).toEqual({ id: 'asc' });
  });

  it('does not include id clause when no cursor', async () => {
    mockFindMany.mockResolvedValue([makeContact('c-1')]);

    await listContacts('ws-1', 50);

    const call = mockFindMany.mock.calls[0]!;
    expect(call[0].where).not.toHaveProperty('id');
  });

  it('sets nextCursor to last item id when full page returned', async () => {
    const contacts = Array.from({ length: 50 }, (_, i) => makeContact(`c-${i}`));
    mockFindMany.mockResolvedValue(contacts);

    const result = await listContacts('ws-1', 50);

    expect(result.nextCursor).toBe('c-49');
  });

  it('sets nextCursor to null when partial page returned', async () => {
    mockFindMany.mockResolvedValue([makeContact('c-1'), makeContact('c-2')]);

    const result = await listContacts('ws-1', 50);

    expect(result.nextCursor).toBeNull();
  });

  it('uses pageSize take param', async () => {
    mockFindMany.mockResolvedValue([]);

    await listContacts('ws-1', 10);

    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
  });
});

describe('importContacts', () => {
  it('calls refreshSegmentCounts after import', async () => {
    const { refreshSegmentCounts } = await import('../services/segments.service.js');
    mockPrisma.contact.upsert.mockResolvedValue({});

    const csv = 'email,firstName\njane@example.com,Jane';
    await importContacts('ws-1', csv, { email: 'email', firstName: 'firstName' });

    await new Promise(r => setTimeout(r, 0));
    expect(refreshSegmentCounts).toHaveBeenCalledWith('ws-1');
  });
});
