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

function parseSelectedWeek(weekStart?: string) {
  if (weekStart) {
    return new Date(`${weekStart}T00:00:00.000Z`);
  }

  return startOfWeek(new Date());
}

function getRiskLevel(score: number) {
  if (score >= 50) return "HIGH" as const;
  if (score >= 25) return "MEDIUM" as const;
  return "LOW" as const;
}

export async function getManagerDashboard(
  query: DashboardQueryInput,
) {
  const selectedWeekStart = parseSelectedWeek(query.weekStart);
  const selectedWeekEnd = new Date(selectedWeekStart);

  selectedWeekEnd.setUTCDate(selectedWeekEnd.getUTCDate() + 6);

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

  const reports = teamMembers
    .map((member) => member.reports[0])
    .filter(
      (
        report,
      ): report is NonNullable<typeof report> => Boolean(report),
    );

  const riskByUser = new Map<
    string,
    {
      score: number;
      level: "LOW" | "MEDIUM" | "HIGH";
      reasons: string[];
    }
  >();

  for (const member of teamMembers) {
    const report = member.reports[0];
    const reasons: string[] = [];
    let score = 0;

    if (!report) {
      score += 40;
      reasons.push("Weekly report has not been started");
    } else {
      const version = report.versions[0];

      if (report.status === ReportStatus.DRAFT) {
        score += 25;
        reasons.push("Report is still in draft");
      }

      if (report.status === ReportStatus.NEEDS_CORRECTION) {
        score += 30;
        reasons.push("Manager corrections are outstanding");
      }

      if (version) {
        const unresolvedBlockers = version.blockers.filter(
          (blocker) => !blocker.isResolved,
        );

        if (unresolvedBlockers.length > 0) {
          score += Math.min(unresolvedBlockers.length * 10, 20);
          reasons.push(
            `${unresolvedBlockers.length} unresolved blocker${
              unresolvedBlockers.length === 1 ? "" : "s"
            }`,
          );
        }

        if (
          unresolvedBlockers.some((blocker) => blocker.isKeyIssue)
        ) {
          score += 15;
          reasons.push("A key issue requires attention");
        }

        const tasksBehindPlan = version.completedTasks.filter(
          (task) =>
            task.actualPercentage < task.plannedPercentage,
        );

        if (tasksBehindPlan.length > 0) {
          score += Math.min(tasksBehindPlan.length * 10, 20);
          reasons.push(
            `${tasksBehindPlan.length} task${
              tasksBehindPlan.length === 1 ? " is" : "s are"
            } behind plan`,
          );
        }

        const tasksOverTime = version.completedTasks.filter(
          (task) => task.spentMinutes > task.plannedMinutes,
        );

        if (tasksOverTime.length > 0) {
          score += Math.min(tasksOverTime.length * 5, 15);
          reasons.push(
            `${tasksOverTime.length} task${
              tasksOverTime.length === 1 ? " exceeds" : "s exceed"
            } planned time`,
          );
        }

        if (version.achievements.length === 0) {
          score += 5;
          reasons.push("No achievement has been recorded");
        }
      }
    }

    const limitedScore = Math.min(score, 100);

    riskByUser.set(member.id, {
      score: limitedScore,
      level: getRiskLevel(limitedScore),
      reasons,
    });
  }

  const statusByMember = teamMembers.map((member) => {
    const report = member.reports[0];
    const risk = riskByUser.get(member.id)!;

    return {
      userId: member.id,
      fullName: member.fullName,
      email: member.email,
      reportId: report?.id ?? null,
      project: report?.project ?? null,
      status: report?.status ?? "NOT_STARTED",
      submittedAt: report?.submittedAt ?? null,
      riskScore: risk.score,
      riskLevel: risk.level,
      riskReasons: risk.reasons,
    };
  });

  const attentionRequired = statusByMember
    .filter((member) => member.riskScore >= 25)
    .sort((first, second) => second.riskScore - first.riskScore)
    .map((member) => ({
      userId: member.userId,
      fullName: member.fullName,
      email: member.email,
      reportId: member.reportId,
      project: member.project,
      status: member.status,
      riskScore: member.riskScore,
      riskLevel: member.riskLevel,
      reasons: member.riskReasons,
    }));

  const submittedReports = reports.filter(
    (report) => report.status !== ReportStatus.DRAFT,
  ).length;

  const needsCorrection = reports.filter(
    (report) => report.status === ReportStatus.NEEDS_CORRECTION,
  ).length;

  const approvedReports = reports.filter(
    (report) => report.status === ReportStatus.APPROVED,
  ).length;

  const draftReports = reports.filter(
    (report) => report.status === ReportStatus.DRAFT,
  ).length;

  const notStarted = teamMembers.length - reports.length;

  const openBlockers = reports.reduce((total, report) => {
    const version = report.versions[0];

    if (!version) return total;

    return (
      total +
      version.blockers.filter((blocker) => !blocker.isResolved)
        .length
    );
  }, 0);

  const complianceRate =
    teamMembers.length === 0
      ? 0
      : Math.round((submittedReports / teamMembers.length) * 100);

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

  const timeCategoryMap = new Map<string, number>();
  let completedTaskCount = 0;

  for (const report of reports) {
    const version = report.versions[0];

    if (!version || !report.project) continue;

    const existingProject = workloadMap.get(report.project.id) ?? {
      projectId: report.project.id,
      projectName: report.project.name,
      color: report.project.color,
      taskCount: 0,
      spentMinutes: 0,
    };

    existingProject.taskCount += version.completedTasks.length;
    existingProject.spentMinutes += version.completedTasks.reduce(
      (total, task) => total + task.spentMinutes,
      0,
    );

    workloadMap.set(report.project.id, existingProject);

    completedTaskCount += version.completedTasks.filter(
      (task) => task.status === TaskStatus.COMPLETED,
    ).length;

    for (const entry of version.timeEntries) {
      timeCategoryMap.set(
        entry.category,
        (timeCategoryMap.get(entry.category) ?? 0) + entry.minutes,
      );
    }
  }

  const timeByCategory = Array.from(timeCategoryMap.entries()).map(
    ([category, minutes]) => ({
      category,
      minutes,
      hours: Number((minutes / 60).toFixed(1)),
    }),
  );

  const totalMinutes = timeByCategory.reduce(
    (total, entry) => total + entry.minutes,
    0,
  );

  const dominantCategory = [...timeByCategory].sort(
    (first, second) => second.minutes - first.minutes,
  )[0];

  const insights: Array<{
    id: string;
    type: "POSITIVE" | "WARNING" | "INFO";
    title: string;
    message: string;
  }> = [];

  if (complianceRate === 100) {
    insights.push({
      id: "full-compliance",
      type: "POSITIVE",
      title: "Full weekly compliance",
      message: "Every active team member submitted a weekly report.",
    });
  } else {
    insights.push({
      id: "compliance-gap",
      type: "WARNING",
      title: `${complianceRate}% reporting compliance`,
      message: `${draftReports + notStarted} team member${
        draftReports + notStarted === 1 ? " has" : "s have"
      } not completed submission.`,
    });
  }

  if (needsCorrection > 0) {
    insights.push({
      id: "corrections",
      type: "WARNING",
      title: "Corrections require follow-up",
      message: `${needsCorrection} report${
        needsCorrection === 1 ? " is" : "s are"
      } waiting for team-member corrections.`,
    });
  }

  if (openBlockers > 0) {
    insights.push({
      id: "blockers",
      type: "WARNING",
      title: "Open blockers detected",
      message: `${openBlockers} unresolved blocker${
        openBlockers === 1 ? " requires" : "s require"
      } management attention.`,
    });
  }

  if (dominantCategory && totalMinutes > 0) {
    const percentage = Math.round(
      (dominantCategory.minutes / totalMinutes) * 100,
    );

    insights.push({
      id: "workload-focus",
      type: "INFO",
      title: `${dominantCategory.category.replaceAll("_", " ")} leads workload`,
      message: `${percentage}% of reported time was allocated to this category.`,
    });
  }

  if (approvedReports > 0) {
    insights.push({
      id: "approvals",
      type: "POSITIVE",
      title: `${approvedReports} approved report${
        approvedReports === 1 ? "" : "s"
      }`,
      message: "Approved work is complete for the selected reporting week.",
    });
  }

  const recentActivity = await prisma.activityLog.findMany({
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
      pendingReports: draftReports + notStarted,
      approvedReports,
      needsCorrection,
      openBlockers,
      completedTaskCount,
      complianceRate,
      highRiskMembers: attentionRequired.filter(
        (member) => member.riskLevel === "HIGH",
      ).length,
    },
    statusDistribution: {
      draft: draftReports,
      submitted: reports.filter(
        (report) => report.status === ReportStatus.SUBMITTED,
      ).length,
      needsCorrection,
      approved: approvedReports,
      notStarted,
    },
    statusByMember,
    workloadByProject: Array.from(workloadMap.values()),
    timeByCategory,
    insights: insights.slice(0, 5),
    attentionRequired,
    recentActivity,
  };
}
