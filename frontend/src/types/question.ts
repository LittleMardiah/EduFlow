export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'essay';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type IELTSSection = 'Listening' | 'Reading' | 'Writing' | 'Speaking';

export interface Option {
  id?: string;
  option_text: string;
  is_correct: boolean;
  order_in_question?: number;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: QuestionType;
  difficulty_level: DifficultyLevel;
  points: number;
  ielts_section?: IELTSSection | null;
  explanation?: string | null;
  correct_answer?: string | null;
  fuzzy_threshold?: number | null;
  manual_review: boolean;
  order_in_quiz: number;
  created_at: string;
  updated_at: string;
  options?: Option[];
}

export interface CreateQuestionInput {
  question_text: string;
  question_type: QuestionType;
  difficulty_level?: DifficultyLevel;
  points?: number;
  ielts_section?: IELTSSection;
  explanation?: string;
  correct_answer?: string;
  fuzzy_threshold?: number;
  manual_review?: boolean;
  order_in_quiz?: number;
  options?: Option[];
}

export interface UpdateQuestionInput {
  question_text?: string;
  question_type?: QuestionType;
  difficulty_level?: DifficultyLevel;
  points?: number;
  ielts_section?: IELTSSection;
  explanation?: string;
  correct_answer?: string;
  fuzzy_threshold?: number;
  manual_review?: boolean;
  order_in_quiz?: number;
  options?: Option[];
}
