import { env } from '../lib/env.js';
import type { EmailSendPayload } from '@bulksend/shared';

export interface SendResult {
  providerMessageId: string;
}

export async function sendEmail(payload: EmailSendPayload, apiKey?: string | null): Promise<SendResult> {
  const html = resolveMergeTags(payload.bodyHtml, payload.variables);
  const text = resolveMergeTags(payload.bodyText, payload.variables);
  const subject = resolveMergeTags(payload.subject, payload.variables);

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey ?? env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: payload.fromName, email: payload.fromEmail },
      to: [{ email: payload.email }],
      subject,
      htmlContent: html,
      textContent: text,
      headers: { 'X-Idempotency-Key': payload.idempotencyKey },
      tags: [payload.sendId],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const err = new Error(`Brevo API error ${response.status}: ${body}`) as Error & { code: number };
    err.code = response.status;
    throw err;
  }

  const data = await response.json() as { messageId: string };
  return { providerMessageId: data.messageId };
}

function resolveMergeTags(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? '');
}
