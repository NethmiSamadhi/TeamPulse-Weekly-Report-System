import { z } from "zod";

const projectFields = {
  name: z
    .string()
    .trim()
    .min(2, "Project name must contain at least 2 characters")
    .max(100, "Project name cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),

  color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "Color must be a valid hexadecimal colour",
    )
    .optional(),
};

export const createProjectSchema = z.object(
  projectFields,
);

export const updateProjectSchema = z
  .object(projectFields)
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update",
  );

export type CreateProjectInput = z.infer<
  typeof createProjectSchema
>;

export type UpdateProjectInput = z.infer<
  typeof updateProjectSchema
>;