import { prisma } from '../db/client.js';
import { redis } from '../redis/client.js';
import { logger } from '../lib/logger.js';
import { env } from '../lib/env.js';
import { buildSegmentContactFilter } from '@bulksend/shared';
import type { RawFilter } from '@bulksend/shared';

const CONTACT_PAGE_SIZE = 500;
const SEND_CONCURRENCY = 5;

function resolveMergeTags(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? '');
}

async function sendViaBrevo(
  contact: { id: string; email: string; firstName: string | null; lastName: string | null },
  campaign: { fromName: string; fromEmail: string; subject: string; bodyHtml: string; bodyText: string; name: string },
  brevoApiKey: string,
  idempotencyKey: string,
  sendId: string,
): Promise<string> {
  const vars = { first_name: contact.firstName ?? '', last_name: contact.lastName ?? '', email: contact.email };
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': brevoApiKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { name: campaign.fromName, email: campaign.fromEmail },
      to: [{ email: contact.email }],
      subject: resolveMergeTags(campaign.subject, vars),
      htmlContent: resolveMergeTags(campaign.bodyHtml, vars),
      textContent: resolveMergeTags(campaign.bodyText, vars),
      headers: { 'X-Idempotency-Key': idempotencyKey },
      tags: [sendId],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const err = new Error(`Brevo API error ${response.status}: ${body}`) as Error & { code: number };
    err.code = response.status;
    throw err;
  }

  const data = await response.json() as { messageId: string };
  return data.messageId;
}

function classifyError(err: unknown): 'auth' | 'permanent' | 'transient' {
  const status = (err as Record<string, unknown>)?.['code'] as number | undefined;
  if (status === 401 || status === 403) return 'auth';
  if (status === 400 || status === 422) return 'permanent';
  return 'transient';
}

async function isSuppressed(workspaceId: string, email: string): Promise<boolean> {
  const contact = await prisma.contact.findFirst({
    where: { workspaceId, email, status: { in: ['unsubscribed', 'bounced'] } },
    select: { id: true },
  });
  return contact !== null;
}

async function markCampaignFailed(campaignId: string, workspaceId: string, campaignName: string): Promise<void> {
  const updated = await prisma.campaign.updateMany({
    where: { id: campaignId, status: 'sending' },
    data: { status: 'failed' },
  });
  if (updated.count > 0) {
    await prisma.notification.create({
      data: {
        workspaceId,
        type: 'campaign_failed',
        title: 'Campaign failed',
        body: `"${campaignName}" could not be sent. Check your Brevo API key in Settings.`,
        metadata: { campaignId },
      },
    });
  }
}

export async function runDispatch(campaignId: string, workspaceId: string): Promise<void> {
  const log = logger.child({ campaignId, workspaceId });
  log.info('Dispatch started (in-process)');

  try {
    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, workspaceId } });
    if (!campaign) { log.warn('Campaign not found'); return; }
    if (campaign.status !== 'sending') { log.warn('Campaign not in sending state, skipping'); return; }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { brevoApiKey: true },
    });
    const brevoApiKey = workspace?.brevoApiKey || env.BREVO_API_KEY;
    if (!brevoApiKey) {
      await prisma.campaign.updateMany({
        where: { id: campaignId, status: 'sending' },
        data: { status: 'failed' },
      });
      await prisma.notification.create({
        data: {
          workspaceId,
          type: 'campaign_failed',
          title: 'Campaign failed — Brevo API key missing',
          body: `"${campaign.name}" could not be sent. Add your Brevo API key in Settings → Integrations.`,
          metadata: { campaignId },
        },
      });
      log.warn('No Brevo API key configured for workspace');
      return;
    }

    const segment = campaign.segmentId
      ? await prisma.segment.findUnique({ where: { id: campaign.segmentId } })
      : null;

    const segmentFilters = segment ? (segment.filters as unknown as RawFilter[]) : [];
    const baseContactWhere = {
      ...buildSegmentContactFilter(workspaceId, segmentFilters),
      status: 'subscribed',
    };

    let cursor: string | undefined;
    let totalContacts = 0;
    let authFailed = false;

    do {
      const contacts = await prisma.contact.findMany({
        where: { ...baseContactWhere, ...(cursor ? { id: { gt: cursor } } : {}) } as never,
        orderBy: { id: 'asc' },
        take: CONTACT_PAGE_SIZE,
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (contacts.length === 0) break;

      await prisma.send.createMany({
        data: contacts.map(c => ({ workspaceId, campaignId, contactId: c.id })),
        skipDuplicates: true,
      });

      for (let i = 0; i < contacts.length; i += SEND_CONCURRENCY) {
        if (authFailed) break;
        const batch = contacts.slice(i, i + SEND_CONCURRENCY);

        await Promise.all(batch.map(async (contact) => {
          const suppressed = await isSuppressed(workspaceId, contact.email);
          if (suppressed) {
            await prisma.send.updateMany({
              where: { campaignId, contactId: contact.id, status: 'pending' },
              data: { status: 'unsubscribed' },
            });
            return;
          }

          try {
            const messageId = await sendViaBrevo(
              contact,
              campaign,
              brevoApiKey,
              `${campaignId}:${contact.id}:1`,
              `${campaignId}:${contact.id}`,
            );
            await prisma.send.updateMany({
              where: { campaignId, contactId: contact.id, status: 'pending' },
              data: { status: 'sent', providerMessageId: messageId, sentAt: new Date() },
            });
          } catch (err) {
            const kind = classifyError(err);
            if (kind === 'auth') {
              authFailed = true;
              await markCampaignFailed(campaignId, workspaceId, campaign.name);
            }
            await prisma.send.updateMany({
              where: { campaignId, contactId: contact.id, status: 'pending' },
              data: { status: 'failed' },
            });
            log.warn({ err, contactId: contact.id, kind }, 'Send failed for contact');
          }
        }));
      }

      totalContacts += contacts.length;
      cursor = contacts.at(-1)?.id;
    } while (true);

    if (!authFailed) {
      await prisma.campaign.updateMany({
        where: { id: campaignId, status: 'sending' },
        data: { status: 'sent', sentAt: new Date(), totalRecipients: totalContacts },
      });
      await prisma.notification.create({
        data: {
          workspaceId,
          type: 'campaign_sent',
          title: 'Campaign sent',
          body: `"${campaign.name}" was sent to ${totalContacts.toLocaleString()} recipient${totalContacts !== 1 ? 's' : ''}.`,
          metadata: { campaignId },
        },
      });
    }

    log.info({ totalContacts, authFailed }, 'Dispatch complete');
  } catch (err) {
    log.error({ err }, 'Dispatch error — marking campaign failed');
    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId } });
    if (campaign) await markCampaignFailed(campaignId, workspaceId, campaign.name);
  }
}
