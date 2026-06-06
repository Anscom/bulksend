import { api } from './client.js';
import type { User, Workspace } from '@bulksend/shared';

export interface MeResponse {
  user: User;
  workspace: Workspace;
}

export const usersApi = {
  me: () => api.get<MeResponse>('/users/me'),
  update: (data: { name?: string; email?: string }) => api.patch<{ user: User }>('/users/me', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<void>('/users/me/change-password', { currentPassword, newPassword }),
};
