// TypeScript interfaces for every Kafka message payload.
// Keeping these in shared ensures api and worker agree on the contract.

export interface CampaignDispatchPayload {
  campaignId: string;
  workspaceId: string;
  dispatchedAt: string; // ISO-8601
}

export interface EmailSendPayload {
  sendId: string;
  campaignId: string;
  workspaceId: string;
  contactId: string;
  email: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  bodyHtml: string;
  bodyText: string;
  variables: Record<string, string>;
  attempt: number;
  idempotencyKey: string;
}

export interface EmailSendRetryPayload extends EmailSendPayload {
  availableAt: string; // ISO-8601 — worker skips until this time
  lastError: string;
  lastAttemptAt: string;
}

export interface EmailSendDlqPayload extends EmailSendPayload {
  errorTrail: Array<{
    attempt: number;
    error: string;
    occurredAt: string;
  }>;
  exhaustedAt: string;
}

export interface EmailEventPayload {
  sendId: string;
  campaignId: string;
  workspaceId: string;
  contactId: string;
  type: 'opened' | 'clicked' | 'bounced' | 'unsubscribed' | 'delivered' | 'spam';
  providerEventId: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
}
