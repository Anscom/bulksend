// Core domain types shared across api, worker, and web

export type PlanTier = 'free' | 'pro' | 'enterprise';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'failed';
export type SendStatus = 'pending' | 'sent' | 'failed' | 'bounced' | 'unsubscribed';
export type EventType = 'opened' | 'clicked' | 'bounced' | 'unsubscribed' | 'delivered' | 'spam';
export type ContactStatus = 'subscribed' | 'unsubscribed' | 'bounced';
export type MemberRole = 'owner' | 'admin' | 'member';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: PlanTier;
  sendRatePerHour: number;
  brevoApiKey?: string | null;
  senderEmail?: string | null;
  senderName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  workspaceId: string;
  email: string;
  name: string;
  role: MemberRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  workspaceId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: ContactStatus;
  attributes: Record<string, unknown>;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Segment {
  id: string;
  workspaceId: string;
  name: string;
  filters: SegmentFilter[];
  contactCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentFilter {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'in' | 'exists';
  value: unknown;
}

export interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  subject: string;
  previewText: string | null;
  fromName: string;
  fromEmail: string;
  bodyHtml: string;
  bodyText: string;
  segmentId: string | null;
  status: CampaignStatus;
  scheduledAt: Date | null;
  sentAt: Date | null;
  totalRecipients: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Send {
  id: string;
  workspaceId: string;
  campaignId: string;
  contactId: string;
  status: SendStatus;
  providerMessageId: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailEvent {
  id: string;
  workspaceId: string;
  sendId: string;
  campaignId: string;
  type: EventType;
  metadata: Record<string, unknown>;
  providerEventId: string | null;
  occurredAt: Date;
  createdAt: Date;
}

export interface CampaignStats {
  campaignId: string;
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface AnalyticsOverview {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  activeContacts: number;
  sentTrend: number;
  deliveryTrend: number;
  openTrend: number;
  contactsTrend: number;
}

export interface VolumePoint {
  date: string;
  delivered: number;
  opened: number;
}
