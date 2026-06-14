import { prisma } from '../db/client.js';
import { Errors } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { runDispatch } from './dispatch.service.js';
import type {
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignStats,
} from '@bulksend/shared';

export async function listCampaigns(
  workspaceId: string,
  page = 1,
  pageSize = 20,
): Promise<{ items: Campaign[]; total: number }> {
  const [items, total] = await Promise.all([
    prisma.campaign.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.campaign.count({ where: { workspaceId } }),
  ]);
  return { items: items as unknown as Campaign[], total };
}

export async function getCampaign(id: string, workspaceId: string): Promise<Campaign> {
  const campaign = await prisma.campaign.findFirst({ where: { id, workspaceId } });
  if (!campaign) throw Errors.notFound('Campaign');
  return campaign as unknown as Campaign;
}

export async function createCampaign(
  workspaceId: string,
  data: CreateCampaignRequest,
): Promise<Campaign> {
  const campaign = await prisma.campaign.create({
    data: { ...data, workspaceId, status: 'draft' },
  });
  return campaign as unknown as Campaign;
}

export async function updateCampaign(
  id: string,
  workspaceId: string,
  data: UpdateCampaignRequest,
): Promise<Campaign> {
  const campaign = await prisma.campaign.findFirst({ where: { id, workspaceId } });
  if (!campaign) throw Errors.notFound('Campaign');
  if (campaign.status !== 'draft') {
    throw Errors.unprocessable('Only draft campaigns can be edited');
  }
  const updated = await prisma.campaign.update({ where: { id }, data });
  return updated as unknown as Campaign;
}

export async function deleteCampaign(id: string, workspaceId: string): Promise<void> {
  const campaign = await prisma.campaign.findFirst({ where: { id, workspaceId } });
  if (!campaign) throw Errors.notFound('Campaign');
  if (['sending', 'sent'].includes(campaign.status)) {
    throw Errors.unprocessable('Cannot delete a sent or in-progress campaign');
  }
  await prisma.campaign.delete({ where: { id } });
}

export async function scheduleCampaign(
  id: string,
  workspaceId: string,
  scheduledAt: Date,
): Promise<Campaign> {
  const campaign = await prisma.campaign.findFirst({ where: { id, workspaceId } });
  if (!campaign) throw Errors.notFound('Campaign');
  if (campaign.status !== 'draft') throw Errors.unprocessable('Campaign is not a draft');
  if (scheduledAt <= new Date()) throw Errors.unprocessable('Scheduled time must be in the future');

  const updated = await prisma.campaign.update({
    where: { id },
    data: { status: 'scheduled', scheduledAt },
  });
  await prisma.notification.create({
    data: {
      workspaceId,
      type: 'campaign_scheduled',
      title: 'Campaign scheduled',
      body: `"${campaign.name}" is scheduled to send on ${scheduledAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.`,
      metadata: { campaignId: id },
    },
  });
  return updated as unknown as Campaign;
}

export async function sendCampaign(
  id: string,
  workspaceId: string,
  _idempotencyKey: string,
): Promise<Campaign> {
  const campaign = await prisma.campaign.findFirst({ where: { id, workspaceId } });
  if (!campaign) throw Errors.notFound('Campaign');
  if (!['draft', 'scheduled'].includes(campaign.status)) {
    throw Errors.unprocessable('Campaign is not in a sendable state');
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: { status: 'sending' },
  });

  setImmediate(() => {
    runDispatch(id, workspaceId).catch((err) => {
      logger.error({ err, campaignId: id }, 'Background dispatch failed');
    });
  });

  return updated as unknown as Campaign;
}

export async function pauseCampaign(id: string, workspaceId: string): Promise<Campaign> {
  const campaign = await prisma.campaign.findFirst({ where: { id, workspaceId } });
  if (!campaign) throw Errors.notFound('Campaign');
  if (campaign.status !== 'sending') throw Errors.unprocessable('Only sending campaigns can be paused');
  const updated = await prisma.campaign.update({ where: { id }, data: { status: 'paused' } });
  return updated as unknown as Campaign;
}

export async function resumeCampaign(
  id: string,
  workspaceId: string,
  _idempotencyKey: string,
): Promise<Campaign> {
  const campaign = await prisma.campaign.findFirst({ where: { id, workspaceId } });
  if (!campaign) throw Errors.notFound('Campaign');
  if (campaign.status !== 'paused') throw Errors.unprocessable('Campaign is not paused');

  const updated = await prisma.campaign.update({ where: { id }, data: { status: 'sending' } });

  setImmediate(() => {
    runDispatch(id, workspaceId).catch((err) => {
      logger.error({ err, campaignId: id }, 'Background dispatch failed');
    });
  });

  return updated as unknown as Campaign;
}

export type CampaignSendRow = {
  id: string;
  status: string;
  sentAt: string | null;
  contactId: string;
  contactEmail: string;
  contactFirstName: string | null;
  contactLastName: string | null;
  contactStatus: string;
};

export async function getCampaignSends(
  id: string,
  workspaceId: string,
  page = 1,
  pageSize = 200,
): Promise<{ items: CampaignSendRow[]; total: number }> {
  const campaign = await prisma.campaign.findFirst({ where: { id, workspaceId } });
  if (!campaign) throw Errors.notFound('Campaign');

  const [items, total] = await Promise.all([
    prisma.send.findMany({
      where: { campaignId: id, workspaceId },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, status: true, sentAt: true,
        contact: { select: { id: true, email: true, firstName: true, lastName: true, status: true } },
      },
    }),
    prisma.send.count({ where: { campaignId: id, workspaceId } }),
  ]);

  return {
    items: items.map((s) => ({
      id: s.id,
      status: s.status,
      sentAt: s.sentAt?.toISOString() ?? null,
      contactId: s.contact.id,
      contactEmail: s.contact.email,
      contactFirstName: s.contact.firstName ?? null,
      contactLastName: s.contact.lastName ?? null,
      contactStatus: s.contact.status,
    })),
    total,
  };
}

export async function getCampaignStats(
  id: string,
  workspaceId: string,
): Promise<CampaignStats> {
  const campaign = await prisma.campaign.findFirst({ where: { id, workspaceId } });
  if (!campaign) throw Errors.notFound('Campaign');

  const [sendCounts, eventCounts] = await Promise.all([
    prisma.send.groupBy({
      by: ['status'],
      where: { campaignId: id, workspaceId },
      _count: { id: true },
    }),
    prisma.emailEvent.groupBy({
      by: ['type'],
      where: { campaignId: id, workspaceId },
      _count: { id: true },
    }),
  ]);

  const sc = Object.fromEntries(sendCounts.map((r) => [r.status, r._count.id]));
  const ec = Object.fromEntries(eventCounts.map((r) => [r.type, r._count.id]));

  const sent = (sc['sent'] ?? 0) + (sc['bounced'] ?? 0) + (sc['failed'] ?? 0);
  const delivered = ec['delivered'] ?? 0;
  const opened = ec['opened'] ?? 0;
  const clicked = ec['clicked'] ?? 0;
  const bounced = sc['bounced'] ?? 0;
  const unsubscribed = ec['unsubscribed'] ?? 0;

  return {
    campaignId: id,
    totalRecipients: campaign.totalRecipients,
    sent,
    delivered,
    opened,
    clicked,
    bounced,
    unsubscribed,
    openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
    clickRate: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
    bounceRate: sent > 0 ? Math.round((bounced / sent) * 100) : 0,
  };
}
