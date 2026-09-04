import { z } from "zod";

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must contain at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(72, "Password cannot exceed 72 characters")
    .regex(
      /[A-Z]/,
      "Password must contain an uppercase letter",
    )
    .regex(
      /[a-z]/,
      "Password must contain a lowercase letter",
    )
    .regex(
      /[0-9]/,
      "Password must contain a number",
    ),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required"),
});

export type RegisterInput = z.infer<
  typeof registerSchema
>;

export type LoginInput = z.infer<
  typeof loginSchema
>;