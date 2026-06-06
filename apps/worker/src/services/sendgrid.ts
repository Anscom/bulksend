import sgMail from '@sendgrid/mail';
import { env } from '../lib/env.js';
import type { EmailSendPayload } from '@bulksend/shared';

sgMail.setApiKey(env.SENDGRID_API_KEY);

export interface SendResult {
  providerMessageId: string;
}

export async function sendEmail(payload: EmailSendPayload): Promise<SendResult> {
  const html = resolveMergeTags(payload.bodyHtml, payload.variables);
  const text = resolveMergeTags(payload.bodyText, payload.variables);
  const subject = resolveMergeTags(payload.subject, payload.variables);

  const [response] = await sgMail.send({
    to: payload.email,
    from: { name: payload.fromName, email: payload.fromEmail },
    subject,
    html,
    text,
    customArgs: { sendId: payload.sendId, workspaceId: payload.workspaceId },
    headers: { 'X-Idempotency-Key': payload.idempotencyKey },
  });

  // SendGrid returns the message ID in the X-Message-Id header
  const messageId = response.headers['x-message-id'] as string ?? payload.idempotencyKey;

  return { providerMessageId: messageId };
}

function resolveMergeTags(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? '');
}
