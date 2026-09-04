import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  FRONTEND_URL: z
    .string()
    .url("FRONTEND_URL must be a valid URL")
    .default("http://localhost:5173"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must contain at least 32 characters"),
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");
  console.error(result.error.flatten().fieldErrors);

  throw new Error("Environment validation failed");
}

export const env = result.data;