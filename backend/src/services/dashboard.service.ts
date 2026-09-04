import {
  ReportStatus,
  TaskStatus,
  UserRole,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  type DashboardQueryInput,
} from "../validators/dashboard.validator.js";

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getUTCDay();
  const difference = (day + 6) % 7;

  result.setUTCDate(result.getUTCDate() - difference);
  result.setUTCHours(0, 0, 0, 0);

  return result;
}

function parseSelectedWeek(
  weekStart?: string,
) {
  if (weekStart) {
    return new Date(
      `${weekStart}T00:00:00.000Z`,
    );
  }

  return startOfWeek(new Date());
}

export async function getManagerDashboard(
  query: DashboardQueryInput,
) {
  const selectedWeekStart = parseSelectedWeek(
    query.weekStart,
  );

  const selectedWeekEnd = new Date(
    selectedWeekStart,
  );

  selectedWeekEnd.setUTCDate(
    selectedWeekEnd.getUTCDate() + 6,
  );

  const teamMembers = await prisma.user.findMany({
    where: {
      role: UserRole.TEAM_MEMBER,
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      reports: {
        where: {
          weekStart: selectedWeekStart,
        },
        take: 1,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          versions: {
            orderBy: {
              versionNumber: "desc",
            },
            take: 1,
            include: {
              completedTasks: true,
              blockers: true,
              timeEntries: true,
              achievements: true,
            },
          },
        },
      },
    },
    orderBy: {
      fullName: "asc",
    },
  });

  const statusByMember = teamMembers.map(
    (member) => {
      const report = member.reports[0];

      return {
        userId: member.id,
        fullName: member.fullName,
        email: member.email,
        reportId: report?.id ?? null,
        project: report?.project ?? null,
        status: report?.status ?? "NOT_STARTED",
        submittedAt:
          report?.submittedAt ?? null,
      };
    },
  );

  const reports = teamMembers
    .map((member) => member.reports[0])
    .filter(
      (
        report,
      ): report is NonNullable<typeof report> =>
        Boolean(report),
    );

  const submittedReports = reports.filter(
    (report) =>
      report.status !== ReportStatus.DRAFT,
  ).length;

  const needsCorrection = reports.filter(
    (report) =>
      report.status ===
      ReportStatus.NEEDS_CORRECTION,
  ).length;

  const approvedReports = reports.filter(
    (report) =>
      report.status === ReportStatus.APPROVED,
  ).length;

  const draftReports = reports.filter(
    (report) =>
      report.status === ReportStatus.DRAFT,
  ).length;

  const notStarted =
    teamMembers.length - reports.length;

  const openBlockers = reports.reduce(
    (total, report) => {
      const version = report.versions[0];

      if (!version) {
        return total;
      }

      return (
        total +
        version.blockers.filter(
          (blocker) => !blocker.isResolved,
        ).length
      );
    },
    0,
  );

  const complianceRate =
    teamMembers.length === 0
      ? 0
      : Math.round(
          (submittedReports / teamMembers.length) *
            100,
        );

  const workloadMap = new Map<
    string,
    {
      projectId: string;
      projectName: string;
      color: string | null;
      taskCount: number;
      spentMinutes: number;
    }
  >();

  const timeCategoryMap = new Map<
    string,
    number
  >();

  let completedTaskCount = 0;

  for (const report of reports) {
    const version = report.versions[0];

    if (!version || !report.project) {
      continue;
    }

    const existingProject =
      workloadMap.get(report.project.id) ?? {
        projectId: report.project.id,
        projectName: report.project.name,
        color: report.project.color,
        taskCount: 0,
        spentMinutes: 0,
      };

    existingProject.taskCount +=
      version.completedTasks.length;

    existingProject.spentMinutes +=
      version.completedTasks.reduce(
        (total, task) =>
          total + task.spentMinutes,
        0,
      );

    workloadMap.set(
      report.project.id,
      existingProject,
    );

    completedTaskCount +=
      version.completedTasks.filter(
        (task) =>
          task.status === TaskStatus.COMPLETED,
      ).length;

    for (const entry of version.timeEntries) {
      timeCategoryMap.set(
        entry.category,
        (timeCategoryMap.get(entry.category) ??
          0) + entry.minutes,
      );
    }
  }

  const recentActivity =
    await prisma.activityLog.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

  return {
    selectedWeek: {
      start: selectedWeekStart,
      end: selectedWeekEnd,
    },

    metrics: {
      totalTeamMembers: teamMembers.length,
      submittedReports,
      pendingReports:
        draftReports + notStarted,
      approvedReports,
      needsCorrection,
      openBlockers,
      completedTaskCount,
      complianceRate,
    },

    statusDistribution: {
      draft: draftReports,
      submitted: reports.filter(
        (report) =>
          report.status ===
          ReportStatus.SUBMITTED,
      ).length,
      needsCorrection,
      approved: approvedReports,
      notStarted,
    },

    statusByMember,

    workloadByProject: Array.from(
      workloadMap.values(),
    ),

    timeByCategory: Array.from(
      timeCategoryMap.entries(),
    ).map(([category, minutes]) => ({
      category,
      minutes,
      hours: Number((minutes / 60).toFixed(1)),
    })),

    recentActivity,
  };
}