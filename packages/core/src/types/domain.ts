export const USER_ROLES = ["admin", "instructor", "student"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const QUIZ_TYPES = ["standard", "ielts_simulation", "timed_exam"] as const;
export type QuizType = (typeof QUIZ_TYPES)[number];

export const QUIZ_STATUSES = ["draft", "published", "archived"] as const;
export type QuizStatus = (typeof QUIZ_STATUSES)[number];

export const QUESTION_TYPES = ["mcq", "true_false", "short_answer", "essay"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const SUBMISSION_STATUSES = ["in_progress", "submitted", "graded"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const EVENT_STATUSES = ["scheduled", "in_progress", "completed", "cancelled"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}