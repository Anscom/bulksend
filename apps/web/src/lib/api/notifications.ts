import { api } from './client';

export interface Notification {
  id: string;
  workspaceId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export async function listNotifications(): Promise<{ notifications: Notification[]; unread: number }> {
  return api.get<{ notifications: Notification[]; unread: number }>('/notifications');
}

export async function markAllRead(): Promise<void> {
  await api.post('/notifications/read-all', {});
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
