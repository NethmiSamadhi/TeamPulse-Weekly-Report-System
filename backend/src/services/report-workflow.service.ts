import {
  Prisma,
  ReportStatus,
  ReviewAction,
  UserRole,
  type User,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  getReportById,
  ReportError,
} from "./report.service.js";
import {
  type ReportContentInput,
  type ReviewReportInput,
} from "../validators/report.validator.js";

type CurrentUser = Pick<User, "id" | "role">;

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function validateProject(
  projectId: string,
) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project || !project.isActive) {
    throw new ReportError(
      "Selected project is unavailable",
      400,
    );
  }
}

async function replaceVersionContent(
  transaction: Prisma.TransactionClient,
  versionId: string,
  input: ReportContentInput,
) {
  await transaction.completedTask.deleteMany({
    where: {
      reportVersionId: versionId,
    },
  });

  await transaction.nextWeekTask.deleteMany({
    where: {
      reportVersionId: versionId,
    },
  });

  await transaction.blocker.deleteMany({
    where: {
      reportVersionId: versionId,
    },
  });

  await transaction.achievement.deleteMany({
    where: {
      reportVersionId: versionId,
    },
  });

  await transaction.timeEntry.deleteMany({
    where: {
      reportVersionId: versionId,
    },
  });

  if (input.completedTasks.length > 0) {
    await transaction.completedTask.createMany({
      data: input.completedTasks.map(
        (task, index) => ({
          reportVersionId: versionId,
          taskName: task.taskName,
          priority: task.priority,
          plannedPercentage:
            task.plannedPercentage,
          actualPercentage:
            task.actualPercentage,
          status: task.status,
          plannedMinutes: task.plannedMinutes,
          spentMinutes: task.spentMinutes,
          deliverable: task.deliverable,
          displayOrder: index,
        }),
      ),
    });
  }

  if (input.nextWeekTasks.length > 0) {
    await transaction.nextWeekTask.createMany({
      data: input.nextWeekTasks.map(
        (task, index) => ({
          reportVersionId: versionId,
          taskName: task.taskName,
          priority: task.priority,
          notes: task.notes,
          displayOrder: index,
        }),
      ),
    });
  }

  if (input.blockers.length > 0) {
    await transaction.blocker.createMany({
      data: input.blockers.map(
        (blocker, index) => ({
          reportVersionId: versionId,
          description: blocker.description,
          isKeyIssue: blocker.isKeyIssue,
          isResolved: blocker.isResolved,
          displayOrder: index,
        }),
      ),
    });
  }

  if (input.achievements.length > 0) {
    await transaction.achievement.createMany({
      data: input.achievements.map(
        (achievement, index) => ({
          reportVersionId: versionId,
          description:
            achievement.description,
          isKeyAchievement:
            achievement.isKeyAchievement,
          displayOrder: index,
        }),
      ),
    });
  }

  if (input.timeEntries.length > 0) {
    await transaction.timeEntry.createMany({
      data: input.timeEntries.map((entry) => ({
        reportVersionId: versionId,
        category: entry.category,
        minutes: entry.minutes,
      })),
    });
  }
}

export async function createReportDraft(
  currentUser: CurrentUser,
  input: ReportContentInput,
) {
  await validateProject(input.projectId);

  const weekStart = toDate(input.weekStart);
  const weekEnd = toDate(input.weekEnd);

  const duplicate =
    await prisma.weeklyReport.findUnique({
      where: {
        userId_weekStart: {
          userId: currentUser.id,
          weekStart,
        },
      },
    });

  if (duplicate) {
    throw new ReportError(
      "You already have a report for this week",
      409,
    );
  }

  const reportId = await prisma.$transaction(
    async (transaction) => {
      const report =
        await transaction.weeklyReport.create({
          data: {
            userId: currentUser.id,
            projectId: input.projectId,
            weekStart,
            weekEnd,
            dueDate: weekEnd,
            status: ReportStatus.DRAFT,
            currentVersionNumber: 1,
          },
        });

      const version =
        await transaction.reportVersion.create({
          data: {
            reportId: report.id,
            versionNumber: 1,
            optionalNotes: input.optionalNotes,
          },
        });

      await replaceVersionContent(
        transaction,
        version.id,
        input,
      );

      await transaction.activityLog.create({
        data: {
          actorId: currentUser.id,
          action: "REPORT_DRAFT_CREATED",
          entityType: "WeeklyReport",
          entityId: report.id,
        },
      });

      return report.id;
    },
  );

  return getReportById(reportId, currentUser);
}

export async function updateReportDraft(
  reportId: string,
  currentUser: CurrentUser,
  input: ReportContentInput,
) {
  await validateProject(input.projectId);

  const report =
    await prisma.weeklyReport.findUnique({
      where: {
        id: reportId,
      },
      include: {
        versions: {
          orderBy: {
            versionNumber: "desc",
          },
          take: 1,
        },
      },
    });

  if (!report) {
    throw new ReportError(
      "Weekly report not found",
      404,
    );
  }

  if (report.userId !== currentUser.id) {
    throw new ReportError(
      "You can edit only your own reports",
      403,
    );
  }

  if (
    report.status !== ReportStatus.DRAFT &&
    report.status !==
      ReportStatus.NEEDS_CORRECTION
  ) {
    throw new ReportError(
      "Only draft reports or reports needing correction can be edited",
      409,
    );
  }

  const currentVersion = report.versions[0];

  if (!currentVersion) {
    throw new ReportError(
      "Report version not found",
      500,
    );
  }

  const weekStart = toDate(input.weekStart);
  const weekEnd = toDate(input.weekEnd);

  const conflictingReport =
    await prisma.weeklyReport.findFirst({
      where: {
        userId: currentUser.id,
        weekStart,
        NOT: {
          id: reportId,
        },
      },
    });

  if (conflictingReport) {
    throw new ReportError(
      "You already have another report for this week",
      409,
    );
  }

  await prisma.$transaction(
    async (transaction) => {
      let editableVersionId = currentVersion.id;
      let versionNumber =
        report.currentVersionNumber;

      // First edit after a correction creates a new
      // version and preserves the submitted version.
      if (
        report.status ===
          ReportStatus.NEEDS_CORRECTION &&
        currentVersion.submittedAt
      ) {
        versionNumber += 1;

        const newVersion =
          await transaction.reportVersion.create({
            data: {
              reportId,
              versionNumber,
              optionalNotes: input.optionalNotes,
            },
          });

        editableVersionId = newVersion.id;
      } else {
        await transaction.reportVersion.update({
          where: {
            id: editableVersionId,
          },
          data: {
            optionalNotes: input.optionalNotes,
          },
        });
      }

      await replaceVersionContent(
        transaction,
        editableVersionId,
        input,
      );

      await transaction.weeklyReport.update({
        where: {
          id: reportId,
        },
        data: {
          projectId: input.projectId,
          weekStart,
          weekEnd,
          dueDate: weekEnd,
          currentVersionNumber: versionNumber,
        },
      });

      await transaction.activityLog.create({
        data: {
          actorId: currentUser.id,
          action: "REPORT_DRAFT_UPDATED",
          entityType: "WeeklyReport",
          entityId: reportId,
          details: {
            versionNumber,
          },
        },
      });
    },
  );

  return getReportById(reportId, currentUser);
}

export async function submitReport(
  reportId: string,
  currentUser: CurrentUser,
) {
  const report =
    await prisma.weeklyReport.findUnique({
      where: {
        id: reportId,
      },
      include: {
        versions: {
          orderBy: {
            versionNumber: "desc",
          },
          take: 1,
          include: {
            _count: {
              select: {
                completedTasks: true,
                nextWeekTasks: true,
                achievements: true,
              },
            },
          },
        },
      },
    });

  if (!report) {
    throw new ReportError(
      "Weekly report not found",
      404,
    );
  }

  if (report.userId !== currentUser.id) {
    throw new ReportError(
      "You can submit only your own reports",
      403,
    );
  }

  if (
    report.status !== ReportStatus.DRAFT &&
    report.status !==
      ReportStatus.NEEDS_CORRECTION
  ) {
    throw new ReportError(
      "This report cannot be submitted in its current status",
      409,
    );
  }

  const currentVersion = report.versions[0];

  if (!currentVersion) {
    throw new ReportError(
      "Report version not found",
      500,
    );
  }

  if (
    report.status ===
      ReportStatus.NEEDS_CORRECTION &&
    currentVersion.submittedAt
  ) {
    throw new ReportError(
      "Edit the report before resubmitting it",
      409,
    );
  }

  if (
    currentVersion._count.completedTasks === 0 ||
    currentVersion._count.nextWeekTasks === 0 ||
    currentVersion._count.achievements === 0
  ) {
    throw new ReportError(
      "Add a completed task, next-week task and achievement before submitting",
      400,
    );
  }

  const submittedAt = new Date();

  await prisma.$transaction([
    prisma.reportVersion.update({
      where: {
        id: currentVersion.id,
      },
      data: {
        submittedAt,
      },
    }),

    prisma.weeklyReport.update({
      where: {
        id: reportId,
      },
      data: {
        status: ReportStatus.SUBMITTED,
        submittedAt,
        approvedAt: null,
      },
    }),

    prisma.activityLog.create({
      data: {
        actorId: currentUser.id,
        action: "REPORT_SUBMITTED",
        entityType: "WeeklyReport",
        entityId: reportId,
        details: {
          versionNumber:
            report.currentVersionNumber,
        },
      },
    }),
  ]);

  return getReportById(reportId, currentUser);
}

export async function reviewReport(
  reportId: string,
  currentUser: CurrentUser,
  input: ReviewReportInput,
) {
  if (
    currentUser.role !== UserRole.MANAGER &&
    currentUser.role !== UserRole.ADMIN
  ) {
    throw new ReportError(
      "Manager access is required",
      403,
    );
  }

  const report =
    await prisma.weeklyReport.findUnique({
      where: {
        id: reportId,
      },
      include: {
        versions: {
          orderBy: {
            versionNumber: "desc",
          },
          take: 1,
        },
      },
    });

  if (!report) {
    throw new ReportError(
      "Weekly report not found",
      404,
    );
  }

  if (report.status !== ReportStatus.SUBMITTED) {
    throw new ReportError(
      "Only submitted reports can be reviewed",
      409,
    );
  }

  const currentVersion = report.versions[0];

  if (!currentVersion) {
    throw new ReportError(
      "Report version not found",
      500,
    );
  }

  const newStatus =
    input.action === ReviewAction.APPROVED
      ? ReportStatus.APPROVED
      : ReportStatus.NEEDS_CORRECTION;

  await prisma.$transaction([
    prisma.reportReview.create({
      data: {
        reportVersionId: currentVersion.id,
        managerId: currentUser.id,
        action: input.action,
        comment: input.comment,
      },
    }),

    prisma.weeklyReport.update({
      where: {
        id: reportId,
      },
      data: {
        status: newStatus,
        latestReviewerComment:
          input.comment ??
          "Approved by the manager",
        approvedAt:
          newStatus === ReportStatus.APPROVED
            ? new Date()
            : null,
      },
    }),

    prisma.activityLog.create({
      data: {
        actorId: currentUser.id,
        action:
          input.action === ReviewAction.APPROVED
            ? "REPORT_APPROVED"
            : "REPORT_CHANGES_REQUESTED",
        entityType: "WeeklyReport",
        entityId: reportId,
        details: {
          versionNumber:
            report.currentVersionNumber,
          comment: input.comment,
        },
      },
    }),
  ]);

  return getReportById(reportId, currentUser);
}