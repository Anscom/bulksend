import { api } from './client.js';
import type { Campaign, CampaignStats, CreateCampaignRequest } from '@bulksend/shared';

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

export const campaignsApi = {
  list: (page = 1, pageSize = 20) =>
    api.get<{ items: Campaign[]; total: number }>(`/campaigns?page=${page}&pageSize=${pageSize}`),
  get: (id: string) => api.get<Campaign>(`/campaigns/${id}`),
  getStats: (id: string) => api.get<CampaignStats>(`/campaigns/${id}/stats`),
  getSends: (id: string, page = 1, pageSize = 200) =>
    api.get<{ items: CampaignSendRow[]; total: number }>(`/campaigns/${id}/sends?page=${page}&pageSize=${pageSize}`),
  create: (data: CreateCampaignRequest) => api.post<Campaign>('/campaigns', data),
  update: (id: string, data: Partial<CreateCampaignRequest>) => api.patch<Campaign>(`/campaigns/${id}`, data),
  delete: (id: string) => api.delete<void>(`/campaigns/${id}`),
  schedule: (id: string, scheduledAt: string) =>
    api.post<Campaign>(`/campaigns/${id}/schedule`, { scheduledAt }),
  send: (id: string) =>
    api.post<Campaign>(`/campaigns/${id}/send`, {}),
  pause: (id: string) =>
    api.post<Campaign>(`/campaigns/${id}/pause`, {}),
  resume: (id: string) =>
    api.post<Campaign>(`/campaigns/${id}/resume`, {}),
};
