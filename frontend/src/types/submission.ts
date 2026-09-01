import type { User } from './auth';

export type SubmissionStatus = 'in_progress' | 'submitted' | 'graded' | 'expired';

export interface SubmissionAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  answer: string | string[] | null;
  is_correct: boolean | null;
  score: number | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionResult {
  id: string;
  quiz_id: string;
  event_id: string | null;
  student_id: string;
  status: SubmissionStatus;
  score: number | null;
  max_score: number | null;
  passed: boolean | null;
  started_at: string;
  submitted_at: string | null;
  answers: SubmissionAnswer[];
  student?: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}
