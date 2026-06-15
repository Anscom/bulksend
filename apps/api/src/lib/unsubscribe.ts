import { createHmac, timingSafeEqual } from 'crypto';

export function generateUnsubscribeToken(workspaceId: string, email: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(`${workspaceId}:${email}`)
    .digest('base64url');
}

export function verifyUnsubscribeToken(workspaceId: string, email: string, token: string, secret: string): boolean {
  const expected = generateUnsubscribeToken(workspaceId, email, secret);
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
