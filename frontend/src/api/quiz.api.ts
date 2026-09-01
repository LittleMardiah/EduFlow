import apiClient from './client';
import type { Quiz, CreateQuizInput } from '../types/quiz';

export type { Quiz, CreateQuizInput };

export const quizApi = {
  getQuizzes: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<{ success: boolean; data: { quizzes: Quiz[]; total: number; page: number; limit: number } }>('/quizzes', { params }),

  getQuiz: (id: string) =>
    apiClient.get<{ success: boolean; data: Quiz }>(`/quizzes/${id}`),

  createQuiz: (data: CreateQuizInput) =>
    apiClient.post<{ success: boolean; data: Quiz }>('/quizzes', data),

  updateQuiz: (id: string, data: Partial<CreateQuizInput>) =>
    apiClient.patch<{ success: boolean; data: Quiz }>(`/quizzes/${id}`, data),

  publishQuiz: (id: string) =>
    apiClient.patch<{ success: boolean; data: Quiz }>(`/quizzes/${id}/publish`),

  archiveQuiz: (id: string) =>
    apiClient.patch<{ success: boolean; data: Quiz }>(`/quizzes/${id}/archive`),

  deleteQuiz: (id: string) =>
    apiClient.delete(`/quizzes/${id}`),
};
