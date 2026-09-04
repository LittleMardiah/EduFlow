import { z } from 'zod';

// ===== CREATE EVENT SCHEMA =====
export const createEventSchema = z.object({
  quiz_id: z.string().min(1, "Quiz ID is required"),
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().optional(),
  scheduled_start_at: z.coerce.date(),
  scheduled_end_at: z.coerce.date(),
  timezone: z.string().regex(/^[A-Za-z_\/]+$/, "Invalid timezone format"),
  allow_retakes: z.boolean().default(false),
  show_answers: z.enum(['immediately', 'after_deadline', 'never']).default('immediately'),
  max_participants: z.number().int().positive().optional(),
});

// ===== UPDATE EVENT SCHEMA (Partial) =====
export const updateEventSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional(),
  scheduled_start_at: z.coerce.date().optional(),
  scheduled_end_at: z.coerce.date().optional(),
  timezone: z.string().regex(/^[A-Za-z_\/]+$/).optional(),
  allow_retakes: z.boolean().optional(),
  show_answers: z.enum(['immediately', 'after_deadline', 'never']).optional(),
  max_participants: z.number().int().positive().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
}).refine(data => {
  if (data.scheduled_start_at && data.scheduled_end_at) {
    return data.scheduled_end_at > data.scheduled_start_at;
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["scheduled_end_at"],
});

// ===== EVENT STATUS UPDATE SCHEMA =====
export const updateEventStatusSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
});

// ===== LIST EVENTS QUERY SCHEMA =====
export const listEventsQuerySchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  quiz_id: z.string().optional(),
  instructor_id: z.string().optional(),
  limit: z.coerce.number().int().positive().default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
