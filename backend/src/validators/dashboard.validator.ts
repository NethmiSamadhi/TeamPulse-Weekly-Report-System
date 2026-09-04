import { z } from "zod";

export const dashboardQuerySchema = z.object({
  weekStart: z
    .string()
    .date("Week start must use YYYY-MM-DD")
    .optional(),
});

export type DashboardQueryInput = z.infer<
  typeof dashboardQuerySchema
>;