import { z } from "zod";

export const assistantQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3, "Question must contain at least 3 characters")
    .max(500, "Question cannot exceed 500 characters"),
  weekStart: z
    .string()
    .date("Week start must use YYYY-MM-DD"),
});

export type AssistantQuestionInput = z.infer<
  typeof assistantQuestionSchema
>;
