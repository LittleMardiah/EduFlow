import { z } from "zod";

export const addParticipantSchema = z.object({
  student_id: z.string().min(1, "Student ID is required"),
});

export const bulkAddParticipantsSchema = z.object({
  student_ids: z
    .array(z.string().min(1))
    .min(1, "At least one student ID required")
    .max(1000, "Max 1000 students per batch"),
});

export const updateParticipantStatusSchema = z.object({
  status: z.enum(["invited", "registered", "attended", "no_show", "withdrew"]),
});

export const listParticipantsQuerySchema = z.object({
  status: z.enum(["invited", "registered", "attended", "no_show", "withdrew"]).optional(),
  limit: z.coerce.number().int().positive().default(50),
  offset: z.coerce.number().int().min(0).default(0),
});