import { api } from './client.js';
import type { Contact, CreateContactRequest } from '@bulksend/shared';

export const contactsApi = {
  list: (page = 1, pageSize = 50, status?: string, search?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    return api.get<{ items: Contact[]; total: number }>(`/contacts?${params}`);
  },
  get: (id: string) => api.get<Contact>(`/contacts/${id}`),
  create: (data: CreateContactRequest) => api.post<Contact>('/contacts', data),
  update: (id: string, data: Partial<CreateContactRequest>) => api.patch<Contact>(`/contacts/${id}`, data),
  delete: (id: string) => api.delete<void>(`/contacts/${id}`),
  import: (csv: string, mapping: Record<string, string>) =>
    api.post<{ imported: number; skipped: number }>('/contacts/import', { csv, mapping }),
};
