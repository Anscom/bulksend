import { api } from './client.js';
import type { Segment, CreateSegmentRequest } from '@bulksend/shared';

export const segmentsApi = {
  list: () => api.get<Segment[]>('/segments'),
  get: (id: string) => api.get<Segment>(`/segments/${id}`),
  create: (data: CreateSegmentRequest) => api.post<Segment>('/segments', data),
  update: (id: string, data: Partial<CreateSegmentRequest>) => api.patch<Segment>(`/segments/${id}`, data),
  delete: (id: string) => api.delete<void>(`/segments/${id}`),
};
