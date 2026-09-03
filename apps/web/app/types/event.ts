export type EventStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type ShowAnswers = 'immediately' | 'after_deadline' | 'never';
export type ParticipantStatus = 'invited' | 'accepted' | 'completed' | 'cancelled';

export interface EventQuiz {
  id: string;
  title: string;
}

export interface Event {
  id: string;
  quiz_id: string;
  title: string;
  description?: string | null;
  scheduled_start_at: string;
  scheduled_end_at: string;
  timezone: string;
  allow_retakes: boolean;
  show_answers: ShowAnswers;
  max_participants: number | null;
  status: EventStatus;
  instructor_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  quiz?: EventQuiz;
}

export interface CreateEventInput {
  quiz_id: string;
  title: string;
  description?: string;
  scheduled_start_at: Date | string;
  scheduled_end_at: Date | string;
  timezone: string;
  allow_retakes?: boolean;
  show_answers?: ShowAnswers;
  max_participants?: number;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  student_id: string;
  status: ParticipantStatus;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}
