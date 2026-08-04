import apiClient from './client';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  quiz_type: 'standard' | 'ielts_simulation' | 'timed_exam';
  total_questions: number;
  passing_score: number;
  duration_minutes: number;
  max_attempts: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  status: 'draft' | 'published' | 'archived';
  is_public: boolean;
  current_version: number;
  total_attempts: number;
  instructor_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  deleted_at: string | null;
}

export interface CreateQuizInput {
  title: string;
  description?: string;
  quiz_type: 'standard' | 'ielts_simulation' | 'timed_exam';
  passing_score: number;
  duration_minutes: number;
  max_attempts: number;
  randomize_questions?: boolean;
  randomize_options?: boolean;
  organization_id?: string;
}

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
