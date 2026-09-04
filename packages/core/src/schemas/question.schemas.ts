import { z } from "zod";

export const createQuestionSchema = z.object({
  question_text: z.string().min(5),
  question_type: z.enum(["mcq", "true_false", "short_answer", "essay"]),
  difficulty_level: z.enum(["easy", "medium", "hard"]).default("medium"),
  points: z.number().int().positive().default(1),
  ielts_section: z.enum(["Listening", "Reading", "Writing", "Speaking"]).optional(),
  explanation: z.string().optional(),
  correct_answer: z.string().optional(),
  fuzzy_threshold: z.number().min(0).max(1).optional(),
  manual_review: z.boolean().default(false),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const reorderQuestionsSchema = z.object({
  orderings: z.array(
    z.object({
      questionId: z.string(),
      order: z.number().int().positive(),
    })
  ),
});