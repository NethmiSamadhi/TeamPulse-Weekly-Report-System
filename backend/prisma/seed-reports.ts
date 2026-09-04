import {
  PrismaClient,
  ReportStatus,
  ReviewAction,
  TaskPriority,
  TaskStatus,
  TimeCategory,
} from "@prisma/client";

type SeedVersion = {
  versionNumber: number;
  taskName: string;
  deliverable: string;
  actualPercentage: number;
  submittedAt?: Date;
  reviewAction?: ReviewAction;
  reviewComment?: string;
  blocker?: string;
};

type SeedReport = {
  userEmail: string;
  projectName: string;
  weekStart: Date;
  weekEnd: Date;
  status: ReportStatus;
  currentVersionNumber: number;
  latestReviewerComment?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  versions: SeedVersion[];
};

export async function seedReports(prisma: PrismaClient) {
  const manager = await prisma.user.findUniqueOrThrow({
    where: {
      email: "manager@teampulse.dev",
    },
  });

  const reports: SeedReport[] = [
    {
      userEmail: "nethmi@teampulse.dev",
      projectName: "Client Portal",
      weekStart: new Date("2026-08-31T00:00:00.000Z"),
      weekEnd: new Date("2026-09-06T00:00:00.000Z"),
      status: ReportStatus.APPROVED,
      currentVersionNumber: 2,
      latestReviewerComment:
        "Approved. The testing evidence is now clearly documented.",
      submittedAt: new Date("2026-09-03T08:30:00.000Z"),
      approvedAt: new Date("2026-09-03T12:00:00.000Z"),
      versions: [
        {
          versionNumber: 1,
          taskName: "Develop authentication API",
          deliverable: "Login and registration API implementation",
          actualPercentage: 85,
          submittedAt: new Date("2026-09-02T08:00:00.000Z"),
          reviewAction: ReviewAction.REQUEST_CHANGES,
          reviewComment:
            "Please include the completed testing evidence and update the actual progress.",
          blocker: "Test environment configuration was delayed.",
        },
        {
          versionNumber: 2,
          taskName: "Develop and test authentication API",
          deliverable:
            "Login and registration APIs with documented test results",
          actualPercentage: 100,
          submittedAt: new Date("2026-09-03T08:30:00.000Z"),
          reviewAction: ReviewAction.APPROVED,
          reviewComment:
            "Approved. The testing evidence is now clearly documented.",
        },
      ],
    },
    {
      userEmail: "kasun@teampulse.dev",
      projectName: "Internal Tooling",
      weekStart: new Date("2026-08-31T00:00:00.000Z"),
      weekEnd: new Date("2026-09-06T00:00:00.000Z"),
      status: ReportStatus.SUBMITTED,
      currentVersionNumber: 1,
      submittedAt: new Date("2026-09-03T09:15:00.000Z"),
      versions: [
        {
          versionNumber: 1,
          taskName: "Create manager dashboard filters",
          deliverable: "Reusable date, user and project filter components",
          actualPercentage: 90,
          submittedAt: new Date("2026-09-03T09:15:00.000Z"),
          blocker: "Waiting for final dashboard metric definitions.",
        },
      ],
    },
    {
      userEmail: "dinithi@teampulse.dev",
      projectName: "Quality Engineering",
      weekStart: new Date("2026-08-31T00:00:00.000Z"),
      weekEnd: new Date("2026-09-06T00:00:00.000Z"),
      status: ReportStatus.NEEDS_CORRECTION,
      currentVersionNumber: 1,
      latestReviewerComment:
        "Please add the missing test coverage figures and clarify the unresolved blocker.",
      submittedAt: new Date("2026-09-03T07:45:00.000Z"),
      versions: [
        {
          versionNumber: 1,
          taskName: "Execute regression test suite",
          deliverable: "Regression testing report",
          actualPercentage: 75,
          submittedAt: new Date("2026-09-03T07:45:00.000Z"),
          reviewAction: ReviewAction.REQUEST_CHANGES,
          reviewComment:
            "Please add the missing test coverage figures and clarify the unresolved blocker.",
          blocker: "Two API test cases are failing intermittently.",
        },
      ],
    },
    {
      userEmail: "ahamed@teampulse.dev",
      projectName: "Research and Development",
      weekStart: new Date("2026-08-31T00:00:00.000Z"),
      weekEnd: new Date("2026-09-06T00:00:00.000Z"),
      status: ReportStatus.DRAFT,
      currentVersionNumber: 1,
      versions: [
        {
          versionNumber: 1,
          taskName: "Research AI-assisted report summaries",
          deliverable: "Initial feasibility notes",
          actualPercentage: 60,
        },
      ],
    },
  ];

  // Safe for development seed data only.
  await prisma.weeklyReport.deleteMany();

  for (const reportData of reports) {
    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: reportData.userEmail,
      },
    });

    const project = await prisma.project.findUniqueOrThrow({
      where: {
        name: reportData.projectName,
      },
    });

    await prisma.weeklyReport.create({
      data: {
        userId: user.id,
        projectId: project.id,
        weekStart: reportData.weekStart,
        weekEnd: reportData.weekEnd,
        status: reportData.status,
        currentVersionNumber: reportData.currentVersionNumber,
        latestReviewerComment: reportData.latestReviewerComment,
        submittedAt: reportData.submittedAt,
        approvedAt: reportData.approvedAt,
        versions: {
          create: reportData.versions.map((version) => ({
            versionNumber: version.versionNumber,
            optionalNotes:
              "Continue improving quality and document the completed work.",
            submittedAt: version.submittedAt,
            completedTasks: {
              create: [
                {
                  taskName: version.taskName,
                  priority: TaskPriority.HIGH,
                  plannedPercentage: 100,
                  actualPercentage: version.actualPercentage,
                  status:
                    version.actualPercentage === 100
                      ? TaskStatus.COMPLETED
                      : TaskStatus.IN_PROGRESS,
                  plannedMinutes: 1200,
                  spentMinutes: 1080,
                  deliverable: version.deliverable,
                  displayOrder: 1,
                },
              ],
            },
            nextWeekTasks: {
              create: [
                {
                  taskName: "Complete the next planned development milestone",
                  priority: TaskPriority.MEDIUM,
                  notes: "Coordinate requirements with the project team.",
                  displayOrder: 1,
                },
              ],
            },
            blockers: version.blocker
              ? {
                  create: [
                    {
                      description: version.blocker,
                      isKeyIssue: true,
                      isResolved: false,
                      displayOrder: 1,
                    },
                  ],
                }
              : undefined,
            achievements: {
              create: [
                {
                  description: `Delivered progress on: ${version.taskName}`,
                  isKeyAchievement: true,
                  displayOrder: 1,
                },
              ],
            },
            timeEntries: {
              create: [
                {
                  category: TimeCategory.DEVELOPMENT,
                  minutes: 1080,
                },
                {
                  category: TimeCategory.MEETINGS,
                  minutes: 180,
                },
                {
                  category: TimeCategory.DOCUMENTATION,
                  minutes: 120,
                },
              ],
            },
            reviews: version.reviewAction
              ? {
                  create: [
                    {
                      managerId: manager.id,
                      action: version.reviewAction,
                      comment: version.reviewComment,
                    },
                  ],
                }
              : undefined,
          })),
        },
      },
    });
  }

  console.log(`Weekly reports created: ${reports.length}`);
}