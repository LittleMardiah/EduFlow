export type QuizType = 'standard' | 'ielts_simulation' | 'timed_exam';

export type QuizStatus = 'draft' | 'published' | 'archived';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  quiz_type: QuizType;
  total_questions: number;
  passing_score: number;
  duration_minutes: number;
  max_attempts: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  status: QuizStatus;
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
  quiz_type: QuizType;
  passing_score: number;
  duration_minutes: number;
  max_attempts: number;
  randomize_questions?: boolean;
  randomize_options?: boolean;
  organization_id?: string;
}

export interface UpdateQuizInput {
  title?: string;
  description?: string;
  quiz_type?: QuizType;
  passing_score?: number;
  duration_minutes?: number;
  max_attempts?: number;
  randomize_questions?: boolean;
  randomize_options?: boolean;
}
