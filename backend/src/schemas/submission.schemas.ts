import { z } from 'zod';

export const createSubmissionSchema = z.object({
  quiz_id: z.string(),
  event_id: z.string().optional(),
});

export const saveAnswerSchema = z.object({
  student_answer: z.string().optional().nullable(),
  option_id: z.string().optional().nullable(),
}).refine(
  (data) => data.student_answer || data.option_id,
  { message: "Either student_answer or option_id must be provided" }
);

export const submitQuizSchema = z.object({
  // no body needed
});

export const listSubmissionsQuerySchema = z.object({
  quiz_id: z.string().optional(),
  student_id: z.string().optional(),
  status: z.enum(['in_progress', 'submitted', 'graded']).optional(),
  limit: z.coerce.number().int().positive().default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
