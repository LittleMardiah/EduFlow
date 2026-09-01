import apiClient from './client';
import type {
  StudentAnalytics,
  InstructorAnalytics,
  QuestionAnalytics,
  CohortAnalytics,
  TrendAnalytics,
} from '../types/analytics';

export const analyticsApi = {
  getStudentAnalytics: (quizId?: string) =>
    apiClient.get<{ success: boolean; data: StudentAnalytics }>('/analytics/student', {
      params: quizId ? { quiz_id: quizId } : undefined,
    }),

  getInstructorAnalytics: (params?: { quiz_id?: string; event_id?: string }) =>
    apiClient.get<{ success: boolean; data: InstructorAnalytics }>('/analytics/instructor', { params }),

  getCohortAnalytics: (eventId: string) =>
    apiClient.get<{ success: boolean; data: CohortAnalytics }>(`/analytics/cohort/${eventId}`),

  getQuestionAnalytics: (questionId: string) =>
    apiClient.get<{ success: boolean; data: QuestionAnalytics }>(`/analytics/questions/${questionId}`),

  getTrendAnalytics: (quizId: string) =>
    apiClient.get<{ success: boolean; data: TrendAnalytics }>(`/analytics/trends/${quizId}`),
};
