import {
  ReportStatus,
  ReviewAction,
  TaskPriority,
  TaskStatus,
  TimeCategory,
} from "@prisma/client";
import { z } from "zod";

export const reportQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),

  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10),

  status: z.nativeEnum(ReportStatus).optional(),
  userId: z.string().trim().min(1).optional(),
  projectId: z.string().trim().min(1).optional(),

  from: z
    .string()
    .date("From must use YYYY-MM-DD")
    .optional(),

  to: z
    .string()
    .date("To must use YYYY-MM-DD")
    .optional(),
});

const completedTaskSchema = z.object({
  taskName: z.string().trim().min(1).max(200),
  priority: z.nativeEnum(TaskPriority),
  plannedPercentage: z.number().min(0).max(100),
  actualPercentage: z.number().min(0).max(100),
  status: z.nativeEnum(TaskStatus),
  plannedMinutes: z.number().int().min(0),
  spentMinutes: z.number().int().min(0),
  deliverable: z.string().trim().max(2000).optional(),
});

const nextWeekTaskSchema = z.object({
  taskName: z.string().trim().min(1).max(200),
  priority: z.nativeEnum(TaskPriority),
  notes: z.string().trim().max(1000).optional(),
});

const blockerSchema = z.object({
  description: z.string().trim().min(1).max(2000),
  isKeyIssue: z.boolean().default(false),
  isResolved: z.boolean().default(false),
});

const achievementSchema = z.object({
  description: z.string().trim().min(1).max(2000),
  isKeyAchievement: z.boolean().default(false),
});

const timeEntrySchema = z.object({
  category: z.nativeEnum(TimeCategory),
  minutes: z.number().int().min(0),
});

export const reportContentSchema = z
  .object({
    weekStart: z
      .string()
      .date("Week start must use YYYY-MM-DD"),

    weekEnd: z
      .string()
      .date("Week end must use YYYY-MM-DD"),

    projectId: z.string().trim().min(1),

    optionalNotes: z
      .string()
      .trim()
      .max(3000)
      .optional(),

    completedTasks: z
      .array(completedTaskSchema)
      .max(30),

    nextWeekTasks: z
      .array(nextWeekTaskSchema)
      .max(30),

    blockers: z
      .array(blockerSchema)
      .max(20),

    achievements: z
      .array(achievementSchema)
      .max(20),

    timeEntries: z
      .array(timeEntrySchema)
      .max(20),
  })
  .superRefine((data, context) => {
    const weekStart = new Date(
      `${data.weekStart}T00:00:00.000Z`,
    );

    const weekEnd = new Date(
      `${data.weekEnd}T00:00:00.000Z`,
    );

    if (weekEnd < weekStart) {
      context.addIssue({
        code: "custom",
        path: ["weekEnd"],
        message:
          "Week end cannot be before week start",
      });
    }

    const keyIssueCount = data.blockers.filter(
      (blocker) => blocker.isKeyIssue,
    ).length;

    if (keyIssueCount > 1) {
      context.addIssue({
        code: "custom",
        path: ["blockers"],
        message:
          "Only one blocker can be the key issue",
      });
    }

    const keyAchievementCount =
      data.achievements.filter(
        (achievement) =>
          achievement.isKeyAchievement,
      ).length;

    if (keyAchievementCount > 1) {
      context.addIssue({
        code: "custom",
        path: ["achievements"],
        message:
          "Only one item can be the key achievement",
      });
    }

    const categories = data.timeEntries.map(
      (entry) => entry.category,
    );

    if (
      new Set(categories).size !== categories.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["timeEntries"],
        message:
          "Each time category can appear only once",
      });
    }
  });

export const reviewReportSchema = z
  .object({
    action: z.nativeEnum(ReviewAction),

    comment: z
      .string()
      .trim()
      .max(3000)
      .optional(),
  })
  .superRefine((data, context) => {
    if (
      data.action === ReviewAction.REQUEST_CHANGES &&
      !data.comment
    ) {
      context.addIssue({
        code: "custom",
        path: ["comment"],
        message:
          "A correction comment is required when requesting changes",
      });
    }
  });

export type ReportQueryInput = z.infer<
  typeof reportQuerySchema
>;

export type ReportContentInput = z.infer<
  typeof reportContentSchema
>;

export type ReviewReportInput = z.infer<
  typeof reviewReportSchema
>;