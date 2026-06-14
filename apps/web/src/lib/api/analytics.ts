import { api } from './client.js';
import type { AnalyticsOverview, VolumePoint, EventType } from '@bulksend/shared';

export interface UsageStats {
  sendsThisHour: number;
  planLimit: number;
  minutesUntilReset: number;
}

export interface CampaignPerformanceRow {
  id: string;
  name: string;
  status: string;
  sentAt: string | null;
  totalRecipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface EventRow {
  id: string;
  type: EventType;
  occurredAt: string;
  campaignId: string;
  campaignName: string;
  contactEmail: string;
  contactFirstName: string | null;
  contactLastName: string | null;
}

export interface EventsPage {
  items: EventRow[];
  total: number;
  page: number;
  pageSize: number;
}

export const analyticsApi = {
  getOverview: () => api.get<AnalyticsOverview>('/analytics/overview'),
  getVolume: (days = 30) => api.get<VolumePoint[]>(`/analytics/volume?days=${days}`),
  getUsage: () => api.get<UsageStats>('/analytics/usage'),
  getCampaigns: (limit = 20) => api.get<CampaignPerformanceRow[]>(`/analytics/campaigns?limit=${limit}`),
  getEvents: (page = 1, pageSize = 50, type?: EventType | '') =>
    api.get<EventsPage>(`/events?page=${page}&pageSize=${pageSize}${type ? `&type=${type}` : ''}`),
};
