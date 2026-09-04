import { z } from "zod";

export const createQuizSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  quiz_type: z.enum(["standard", "ielts_simulation", "timed_exam"]),
  passing_score: z.number().min(0).max(100),
  duration_minutes: z.number().int().positive(),
  max_attempts: z.number().int().min(-1),
  randomize_questions: z.boolean().default(false),
  randomize_options: z.boolean().default(false),
});

export const updateQuizSchema = createQuizSchema.partial();

export const publishQuizSchema = z.object({
  change_reason: z.string().optional(),
});