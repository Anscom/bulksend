import { parse } from 'csv-parse/sync';
import { prisma } from '../db/client.js';
import { Errors } from '../lib/errors.js';
import { redis } from '../redis/client.js';
import { suppKey, suppLoadedKey } from '../redis/keys.js';
import type { Contact, CreateContactRequest, UpdateContactRequest } from '@bulksend/shared';
import { refreshSegmentCounts } from './segments.service.js';

export async function listContacts(
  workspaceId: string,
  page = 1,
  pageSize = 50,
  status?: string,
  search?: string,
): Promise<{ items: Contact[]; total: number }> {
  const where = {
    workspaceId,
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(search ? { OR: [{ email: { contains: search } }, { firstName: { contains: search } }] } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.contact.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.contact.count({ where }),
  ]);
  return { items: items as unknown as Contact[], total };
}

export async function getContact(id: string, workspaceId: string): Promise<Contact> {
  const contact = await prisma.contact.findFirst({ where: { id, workspaceId, deletedAt: null } });
  if (!contact) throw Errors.notFound('Contact');
  return contact as unknown as Contact;
}

export async function createContact(
  workspaceId: string,
  data: CreateContactRequest,
): Promise<Contact> {
  const existing = await prisma.contact.findFirst({ where: { workspaceId, email: data.email } });
  if (existing) throw Errors.conflict('Contact with this email already exists');

  const contact = await prisma.contact.create({
    data: { ...data, workspaceId, status: 'subscribed', attributes: data.attributes ?? {} },
  });
  return contact as unknown as Contact;
}

export async function updateContact(
  id: string,
  workspaceId: string,
  data: UpdateContactRequest,
): Promise<Contact> {
  const contact = await prisma.contact.findFirst({ where: { id, workspaceId, deletedAt: null } });
  if (!contact) throw Errors.notFound('Contact');

  const updated = await prisma.contact.update({ where: { id }, data });

  // Sync suppression cache when unsubscribing
  if (data.status === 'unsubscribed') {
    await redis.sadd(suppKey(workspaceId), contact.email);
  }

  // Refresh segment counts if status changed (subscribed ↔ unsubscribed/bounced affects counts)
  const newStatus = (data as Record<string, unknown>)['status'];
  if (newStatus !== undefined && newStatus !== contact.status) {
    refreshSegmentCounts(workspaceId).catch(() => {});
  }

  return updated as unknown as Contact;
}

export async function deleteContact(id: string, workspaceId: string): Promise<void> {
  const contact = await prisma.contact.findFirst({ where: { id, workspaceId, deletedAt: null } });
  if (!contact) throw Errors.notFound('Contact');
  await prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  await refreshSegmentCounts(workspaceId);
}

export async function importContacts(
  workspaceId: string,
  csvContent: string,
  mapping: Record<string, string>,
): Promise<{ imported: number; skipped: number }> {
  const rows = parse(csvContent, { columns: true, skip_empty_lines: true }) as Record<string, string>[];

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const email = row[mapping['email'] ?? 'email'];
    if (!email) { skipped++; continue; }

    await prisma.contact.upsert({
      where: { workspaceId_email: { workspaceId, email } },
      create: {
        workspaceId,
        email,
        firstName: mapping['firstName'] ? row[mapping['firstName']] ?? null : null,
        lastName: mapping['lastName'] ? row[mapping['lastName']] ?? null : null,
        status: 'subscribed',
        attributes: {},
      },
      update: {
        firstName: mapping['firstName'] ? row[mapping['firstName']] ?? undefined : undefined,
        lastName: mapping['lastName'] ? row[mapping['lastName']] ?? undefined : undefined,
      },
    });
    imported++;
  }

  return { imported, skipped };
}

export async function unsubscribeByToken(token: string, workspaceId: string): Promise<void> {
  const contact = await prisma.contact.findFirst({
    where: { workspaceId, email: token, deletedAt: null },
  });
  if (!contact) return; // silent — don't leak whether the contact exists

  await prisma.contact.update({ where: { id: contact.id }, data: { status: 'unsubscribed' } });

  await redis
    .multi()
    .sadd(suppKey(workspaceId), contact.email)
    .set(suppLoadedKey(workspaceId), '1')
    .exec();
}
