import {
  Prisma,
  UserRole,
  type User,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  type ReportQueryInput,
} from "../validators/report.validator.js";

type CurrentUser = Pick<
  User,
  "id" | "role"
>;

export class ReportError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ReportError";
  }
}

function isManager(role: UserRole) {
  return (
    role === UserRole.MANAGER ||
    role === UserRole.ADMIN
  );
}

export async function listReports(
  currentUser: CurrentUser,
  query: ReportQueryInput,
) {
  const where: Prisma.WeeklyReportWhereInput = {};

  if (isManager(currentUser.role)) {
    if (query.userId) {
      where.userId = query.userId;
    }
  } else {
    // Members can only list their own reports.
    where.userId = currentUser.id;
  }

  if (query.projectId) {
    where.projectId = query.projectId;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.from || query.to) {
    where.weekStart = {
      ...(query.from
        ? {
            gte: new Date(
              `${query.from}T00:00:00.000Z`,
            ),
          }
        : {}),
      ...(query.to
        ? {
            lte: new Date(
              `${query.to}T23:59:59.999Z`,
            ),
          }
        : {}),
    };
  }

  const skip =
    (query.page - 1) * query.pageSize;

  const [total, reports] = await prisma.$transaction([
    prisma.weeklyReport.count({
      where,
    }),

    prisma.weeklyReport.findMany({
      where,
      skip,
      take: query.pageSize,
      orderBy: [
        {
          weekStart: "desc",
        },
        {
          updatedAt: "desc",
        },
      ],
      select: {
        id: true,
        weekStart: true,
        weekEnd: true,
        status: true,
        currentVersionNumber: true,
        latestReviewerComment: true,
        submittedAt: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            versions: true,
          },
        },
      },
    }),
  ]);

  return {
    reports,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(
        total / query.pageSize,
      ),
    },
  };
}

export async function getReportById(
  reportId: string,
  currentUser: CurrentUser,
) {
  const report =
    await prisma.weeklyReport.findUnique({
      where: {
        id: reportId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        project: true,
        versions: {
          orderBy: {
            versionNumber: "desc",
          },
          include: {
            completedTasks: {
              orderBy: {
                displayOrder: "asc",
              },
            },
            nextWeekTasks: {
              orderBy: {
                displayOrder: "asc",
              },
            },
            blockers: {
              orderBy: {
                displayOrder: "asc",
              },
            },
            achievements: {
              orderBy: {
                displayOrder: "asc",
              },
            },
            timeEntries: true,
            reviews: {
              orderBy: {
                createdAt: "desc",
              },
              include: {
                manager: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
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

  const ownsReport =
    report.userId === currentUser.id;

  if (
    !ownsReport &&
    !isManager(currentUser.role)
  ) {
    throw new ReportError(
      "You cannot access another team member's report",
      403,
    );
  }

  return report;
}