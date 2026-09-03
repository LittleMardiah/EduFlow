import apiClient from './client';
import type { ApiResponse } from '@/app/types/submission';
import type { Event, CreateEventInput, EventParticipant } from '@/app/types/event';

export const eventApi = {
  getEvents: (params?: {
    status?: string;
    quiz_id?: string;
    limit?: number;
    offset?: number;
  }) =>
    apiClient.get<ApiResponse<Event[]>>('/events', { params }),

  getEvent: (id: string) =>
    apiClient.get<ApiResponse<Event>>(`/events/${id}`),

  createEvent: (data: CreateEventInput) =>
    apiClient.post<{ success: boolean; data: Event }>('/events', data),

  updateEvent: (id: string, data: Partial<CreateEventInput>) =>
    apiClient.patch<{ success: boolean; data: Event }>(`/events/${id}`, data),

  updateStatus: (id: string, status: Event['status']) =>
    apiClient.patch<{ success: boolean; data: Event }>(`/events/${id}/status`, { status }),

  deleteEvent: (id: string) =>
    apiClient.delete(`/events/${id}`),

  getParticipants: (eventId: string, params?: Record<string, unknown>) =>
    apiClient.get<{ success: boolean; data: EventParticipant[] }>(`/events/${eventId}/participants`, { params }),

  addParticipant: (eventId: string, studentId: string) =>
    apiClient.post<{ success: boolean; data: EventParticipant }>(`/events/${eventId}/participants`, { student_id: studentId }),

  bulkAddParticipants: (eventId: string, studentIds: string[]) =>
    apiClient.post<{ success: boolean; data: unknown }>(`/events/${eventId}/participants/bulk`, { student_ids: studentIds }),

  removeParticipant: (eventId: string, participantId: string) =>
    apiClient.delete(`/events/${eventId}/participants/${participantId}`),
};
