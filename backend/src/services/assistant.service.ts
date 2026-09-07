import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import type {
  AssistantQuestionInput,
} from "../validators/assistant.validator.js";

type ReportContext = Awaited<
  ReturnType<typeof loadReportContext>
>;

async function loadReportContext(
  weekStart: string,
) {
  const start = new Date(
    `${weekStart}T00:00:00.000Z`,
  );

  return prisma.weeklyReport.findMany({
    where: {
      weekStart: start,
    },

    orderBy: {
      user: {
        fullName: "asc",
      },
    },

    select: {
      status: true,

      user: {
        select: {
          fullName: true,
        },
      },

      project: {
        select: {
          name: true,
        },
      },

      versions: {
        orderBy: {
          versionNumber: "desc",
        },

        take: 1,

        select: {
          completedTasks: {
            select: {
              taskName: true,
              priority: true,
              status: true,
              plannedPercentage: true,
              actualPercentage: true,
              plannedMinutes: true,
              spentMinutes: true,
              deliverable: true,
            },
          },

          nextWeekTasks: {
            select: {
              taskName: true,
              priority: true,
              notes: true,
            },
          },

          blockers: {
            select: {
              description: true,
              isKeyIssue: true,
              isResolved: true,
            },
          },

          achievements: {
            select: {
              description: true,
              isKeyAchievement: true,
            },
          },

          timeEntries: {
            select: {
              category: true,
              minutes: true,
            },
          },
        },
      },
    },
  });
}

function safeContext(
  reports: ReportContext,
) {
  return reports.map((report) => ({
    member: report.user.fullName,

    project:
      report.project?.name ?? "Unassigned",

    status: report.status,

    report:
      report.versions[0] ?? null,
  }));
}

function localSummary(
  question: string,
  reports: ReportContext,
) {
  if (reports.length === 0) {
    return (
      "No reports exist for the selected week, " +
      "so there is not enough data to answer this question."
    );
  }

  const submitted = reports.filter(
    (report) =>
      report.status !== "DRAFT",
  ).length;

  const blockers = reports
    .flatMap(
      (report) =>
        report.versions[0]?.blockers ?? [],
    )
    .filter(
      (item) => !item.isResolved,
    );

  const names = reports
    .map(
      (report) =>
        report.user.fullName,
    )
    .join(", ");

  return (
    `For the selected week, ${submitted} of ` +
    `${reports.length} available reports have moved beyond draft. ` +
    `Reports are available for ${names}. ` +
    `There ${blockers.length === 1 ? "is" : "are"} ` +
    `${blockers.length} unresolved ` +
    `blocker${blockers.length === 1 ? "" : "s"}. ` +
    "Review the report cards for exact task and workload details. " +
    `Your question was: "${question}"`
  );
}

function extractGeminiText(
  payload: unknown,
) {
  const data = payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  return data.candidates?.[0]
    ?.content?.parts
    ?.map(
      (part) =>
        part.text ?? "",
    )
    .join("")
    .trim();
}

function cleanAssistantText(
  value: string,
) {
  return value
    // Remove Markdown bold markers.
    .replace(
      /\*\*(.*?)\*\*/g,
      "$1",
    )

    // Remove Markdown heading and
    // bullet markers at line beginnings.
    .replace(
      /^\s*[*#]+\s?/gm,
      "",
    )

    // Remove Markdown backticks.
    .replace(
      /`/g,
      "",
    )

    // Remove excessive blank lines.
    .replace(
      /\n{3,}/g,
      "\n\n",
    )

    .trim();
}

export async function answerManagerQuestion(
  input: AssistantQuestionInput,
) {
  const reports =
    await loadReportContext(
      input.weekStart,
    );

  /*
   * If no Gemini key is configured,
   * provide a clearly labelled,
   * deterministic local summary.
   */
  if (!env.GEMINI_API_KEY) {
    return {
      answer: localSummary(
        input.question,
        reports,
      ),

      generatedBy:
        "LOCAL_ANALYTICS" as const,

      reportCount:
        reports.length,
    };
  }

  const systemInstruction = [
    "You are TeamPulse Insights, a manager decision-support assistant.",

    "Answer only from the supplied weekly-report JSON.",

    "Do not invent facts, performance ratings, diagnoses, or employee intentions.",

    "If evidence is missing, say so clearly.",

    "Use concise business language and mention member names only when relevant.",

    "Separate observed facts from suggested manager actions.",

    "Never claim that your response replaces manager judgment.",

    "Return clean plain text only. Do not use Markdown symbols such as asterisks, headings, backticks, or tables.",
  ].join(" ");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      env.GEMINI_MODEL,
    )}:generateContent`,

    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "x-goog-api-key":
          env.GEMINI_API_KEY,
      },

      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                systemInstruction,
            },
          ],
        },

        contents: [
          {
            role: "user",

            parts: [
              {
                text:
                  `Selected week: ${input.weekStart}\n` +
                  `Manager question: ${input.question}\n` +
                  "Report data:\n" +
                  JSON.stringify(
                    safeContext(reports),
                  ),
              },
            ],
          },
        ],

        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 700,
        },
      }),

      signal:
        AbortSignal.timeout(15000),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Gemini request failed with status ${response.status}`,
    );
  }

  const generatedText =
    extractGeminiText(
      await response.json(),
    );

  const answer =
    generatedText
      ? cleanAssistantText(
          generatedText,
        )
      : "";

  if (!answer) {
    throw new Error(
      "Gemini returned an empty response",
    );
  }

  return {
    answer,

    generatedBy:
      "GEMINI" as const,

    reportCount:
      reports.length,
  };
}