import { prisma } from '../db/client.js';
import { env } from '../lib/env.js';
import { Errors } from '../lib/errors.js';
import { resolveMergeTags } from '../lib/merge-tags.js';

export async function sendTestEmail(
  campaignId: string,
  workspaceId: string,
  toEmail: string,
): Promise<void> {
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, workspaceId } });
  if (!campaign) throw Errors.notFound('Campaign');

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { brevoApiKey: true },
  });

  const vars: Record<string, string> = {
    first_name: 'Test',
    last_name: 'User',
    email: toEmail,
    unsubscribe_url: `${env.APP_URL}/unsubscribe/preview`,
  };

  const html = resolveMergeTags(campaign.bodyHtml, vars, true);
  const text = resolveMergeTags(campaign.bodyText, vars);
  const subject = `[TEST] ${resolveMergeTags(campaign.subject, vars)}`;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': workspace?.brevoApiKey ?? env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: campaign.fromName, email: campaign.fromEmail },
      to: [{ email: toEmail }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw Errors.unprocessable(`Brevo rejected the test send: ${response.status} ${body}`);
  }
}
