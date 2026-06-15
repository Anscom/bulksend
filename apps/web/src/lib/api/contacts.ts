import { api } from './client.js';
import type { Contact, CreateContactRequest } from '@bulksend/shared';

const API_BASE = (import.meta.env['VITE_API_URL'] ?? '') + '/api/v1';

export const contactsApi = {
  list: (pageSize = 50, status?: string, search?: string, cursor?: string) => {
    const params = new URLSearchParams({ pageSize: String(pageSize) });
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    if (cursor) params.set('cursor', cursor);
    return api.get<{ items: Contact[]; total: number; nextCursor: string | null }>(`/contacts?${params}`);
  },
  get: (id: string) => api.get<Contact>(`/contacts/${id}`),
  create: (data: CreateContactRequest) => api.post<Contact>('/contacts', data),
  update: (id: string, data: Partial<CreateContactRequest>) => api.patch<Contact>(`/contacts/${id}`, data),
  delete: (id: string) => api.delete<void>(`/contacts/${id}`),
  import: (csv: string, mapping: Record<string, string>) =>
    api.post<{ imported: number; skipped: number }>('/contacts/import', { csv, mapping }),
  export: (status?: string): string => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const qs = params.toString();
    return `${API_BASE}/contacts/export${qs ? `?${qs}` : ''}`;
  },
};
