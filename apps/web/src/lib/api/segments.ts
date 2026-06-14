import { api } from './client.js';
import type { Segment, Contact, CreateSegmentRequest } from '@bulksend/shared';

export const segmentsApi = {
  list:     (page = 1, pageSize = 50)                  => api.get<{ items: Segment[]; total: number }>(`/segments?page=${page}&pageSize=${pageSize}`),
  get:      (id: string)                               => api.get<Segment>(`/segments/${id}`),
  contacts: (id: string, page = 1, pageSize = 50)     => api.get<{ contacts: Contact[]; total: number }>(`/segments/${id}/contacts?page=${page}&pageSize=${pageSize}`),
  create:   (data: CreateSegmentRequest)               => api.post<Segment>('/segments', data),
  update:   (id: string, data: Partial<CreateSegmentRequest>) => api.patch<Segment>(`/segments/${id}`, data),
  delete:   (id: string)                               => api.delete<void>(`/segments/${id}`),
};
