import { z } from "zod";

export const createOptionSchema = z.object({
  option_text: z.string().min(1),
  is_correct: z.boolean().default(false),
  order_in_question: z.number().int().positive().optional(),
});

export const updateOptionSchema = createOptionSchema.partial();