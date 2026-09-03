export interface StudentAnalytics {
  completed_count: number;
  average_score: number;
  pass_rate: number;
  total_attempts: number;
  best_score: number;
  quiz_history: {
    quiz_id: string;
    quiz_title: string;
    score: number;
    max_score: number;
    passed: boolean;
    submitted_at: string;
  }[];
}

export interface InstructorAnalytics {
  total_students: number;
  total_quizzes: number;
  total_submissions: number;
  average_score: number;
  pass_rate: number;
  score_distribution: {
    bucket: string;
    count: number;
  }[];
}

export interface QuestionAnalytics {
  question_id: string;
  question_text: string;
  total_attempts: number;
  correct_count: number;
  correct_percentage: number;
}

export interface CohortAnalytics {
  event_id: string;
  event_title: string;
  total_participants: number;
  completed_count: number;
  average_score: number;
  participants: {
    student_id: string;
    student_name: string;
    score: number | null;
    passed: boolean | null;
    status: string;
  }[];
}

export interface TrendAnalytics {
  labels: string[];
  scores: number[];
}
