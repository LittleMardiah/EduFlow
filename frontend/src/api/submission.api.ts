import apiClient from './client';
import type { ApiResponse, SubmissionResult } from '../types/submission';

export const submissionApi = {
  createSubmission: (quizId: string, eventId?: string) =>
    apiClient.post<{ success: boolean; data: SubmissionResult }>('/submissions', {
      quiz_id: quizId,
      event_id: eventId,
    }),

  saveAnswer: (submissionId: string, questionId: string, answer: string | string[]) =>
    apiClient.put(`/submissions/${submissionId}/answers/${questionId}`, { answer }),

  submitQuiz: (submissionId: string) =>
    apiClient.post<{ success: boolean; data: SubmissionResult }>(
      `/submissions/${submissionId}/submit`
    ),

  getSubmission: (submissionId: string) =>
    apiClient.get<ApiResponse<SubmissionResult>>(`/submissions/${submissionId}`),

  listStudentSubmissions: (quizId: string, params?: { student_id?: string }) =>
    apiClient.get(`/quizzes/${quizId}/submissions`, { params }),
};
