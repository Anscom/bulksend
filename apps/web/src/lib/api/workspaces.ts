import { api } from './client.js';
import type { Workspace, User, WorkspaceSummary } from '@bulksend/shared';

export const workspacesApi = {
  get: (id: string) => api.get<Workspace>(`/workspaces/${id}`),
  update: (id: string, data: { name?: string; sendRatePerHour?: number; brevoApiKey?: string; senderEmail?: string; senderName?: string }) =>
    api.patch<Workspace>(`/workspaces/${id}`, data),
  listMine: () => api.get<WorkspaceSummary[]>('/workspaces/mine'),
  create: (name: string) => api.post<{ workspace: Workspace }>('/workspaces', { name }),
  listMembers: (id: string) => api.get<User[]>(`/workspaces/${id}/members`),
  addMember: (id: string, data: { email: string; name: string; password: string; role: 'member' | 'admin' }) =>
    api.post<User>(`/workspaces/${id}/members`, data),
  removeMember: (id: string, userId: string) =>
    api.delete<void>(`/workspaces/${id}/members/${userId}`),
};
