import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ListChecks,
  MessageSquare,
 Pencil,
  Printer,
  Send,
  Trophy,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import "../styles/report-detail.css";
import "../styles/report-print.css";

type CompletedTask = {
  id: string;
  taskName: string;
  priority: string;
  plannedPercentage: string;
  actualPercentage: string;
  status: string;
  plannedMinutes: number;
  spentMinutes: number;
  deliverable: string | null;
};

type ReportVersion = {
  id: string;
  versionNumber: number;
  optionalNotes: string | null;
  submittedAt: string | null;
  completedTasks: CompletedTask[];
  nextWeekTasks: Array<{
    id: string;
    taskName: string;
    priority: string;
    notes: string | null;
  }>;
  blockers: Array<{
    id: string;
    description: string;
    isKeyIssue: boolean;
    isResolved: boolean;
  }>;
  achievements: Array<{
    id: string;
    description: string;
    isKeyAchievement: boolean;
  }>;
  timeEntries: Array<{
    id: string;
    category: string;
    minutes: number;
  }>;
  reviews: Array<{
    id: string;
    action: string;
    comment: string | null;
    createdAt: string;
    manager: {
      fullName: string;
    };
  }>;
};

type Report = {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: string;
  currentVersionNumber: number;
  latestReviewerComment: string | null;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  project: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  versions: ReportVersion[];
};

function readable(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder
    ? `${hours}h ${remainder}m`
    : `${hours}h`;
}

export function ReportDetailPage() {
  const { reportId } = useParams();
  const { user } = useAuth();

  const [report, setReport] =
    useState<Report | null>(null);

  const [selectedVersion, setSelectedVersion] =
    useState<number | null>(null);

  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isReviewing, setIsReviewing] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const isManager =
    user?.role === "MANAGER" ||
    user?.role === "ADMIN";

  async function loadReport() {
    if (!reportId) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await api.get<{
        data: {
          report: Report;
        };
      }>(`/reports/${reportId}`);

      const loadedReport =
        response.data.data.report;

      setReport(loadedReport);
      setSelectedVersion(
        loadedReport.currentVersionNumber,
      );
    } catch {
      setError(
        "The report could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReport();
  }, [reportId]);

  async function handleReview(
    action: "APPROVED" | "REQUEST_CHANGES",
  ) {
    if (!reportId) {
      return;
    }

    if (
      action === "REQUEST_CHANGES" &&
      !comment.trim()
    ) {
      setError(
        "Enter a correction comment before requesting changes.",
      );
      return;
    }

    setIsReviewing(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post<{
        message: string;
        data: {
          report: Report;
        };
      }>(`/reports/${reportId}/review`, {
        action,
        comment:
          comment.trim() || undefined,
      });

      setReport(response.data.data.report);
      setMessage(response.data.message);
      setComment("");
    } catch {
      setError(
        "The review action could not be completed.",
      );
    } finally {
      setIsReviewing(false);
    }
  }

  async function handleSubmitReport() {
    if (!reportId) return;
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response = await api.post<{
        message: string;
        data: { report: Report };
      }>(`/reports/${reportId}/submit`);
      setReport(response.data.data.report);
      setMessage(response.data.message);
    } catch (caught) {
      const apiMessage = (caught as {
        response?: { data?: { message?: string } };
      }).response?.data?.message;
      setError(apiMessage ?? "The report could not be submitted.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="app-page">
        <section className="content-card empty-state">
          <div className="loader-spinner" />
          <p>Loading complete report...</p>
        </section>
      </main>
    );
  }

  if (error && !report) {
    return (
      <main className="app-page">
        <div className="alert alert-error">
          {error}
        </div>
      </main>
    );
  }

  if (!report) {
    return null;
  }

  const version =
    report.versions.find(
      (item) =>
        item.versionNumber === selectedVersion,
    ) ?? report.versions[0];

  const canEdit =
    user?.id === report.user.id &&
    (report.status === "DRAFT" ||
      report.status === "NEEDS_CORRECTION");

  return (
  <main className="app-page">
    <div className="print-document-label">
      <strong>TeamPulse Weekly Report</strong>
      <span>
        Generated{" "}
        {new Date().toLocaleDateString("en-GB")}
      </span>
    </div>

      <Link
        className="back-link"
        to="/reports"
      >
        <ArrowLeft size={17} />
        Back to reports
      </Link>

      <header className="report-detail-header">
        <div>
          <p className="eyebrow">
            Weekly report detail
          </p>

          <h1>{report.user.fullName}</h1>

          <p>
            {new Date(
              report.weekStart,
            ).toLocaleDateString("en-GB")}{" "}
            -{" "}
            {new Date(
              report.weekEnd,
            ).toLocaleDateString("en-GB")}
          </p>
        </div>

        <div className="report-header-meta">
          <span
            className={`status-badge ${report.status.toLowerCase()}`}
          >
            {readable(report.status)}
          </span>

          <strong>
            {report.project?.name ??
              "No project"}
          </strong>
          <button
            className="print-report-button"
            type="button"
            onClick={() => window.print()}
          >
            <Printer size={17} />
            Export PDF
          </button>
        </div>
      </header>

      {canEdit && (
        <section className="member-report-actions">
          <div>
            <strong>
              {report.status === "NEEDS_CORRECTION"
                ? "Corrections requested"
                : "This report is still a draft"}
            </strong>
            <span>
              Edit the content or submit it for manager review.
            </span>
          </div>

          <div>
            <Link
              className="edit-report-button"
              to={`/reports/${report.id}/edit`}
            >
              <Pencil size={17} />
              Edit report
            </Link>

            <button
              className="submit-report-button"
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleSubmitReport()}
            >
              <Send size={17} />
              {isSubmitting ? "Submitting..." : "Submit report"}
            </button>
          </div>
        </section>
      )}

      {report.latestReviewerComment && (
        <section className="review-notice">
          <MessageSquare size={20} />
          <div>
            <strong>Latest manager feedback</strong>
            <p>
              {report.latestReviewerComment}
            </p>
          </div>
        </section>
      )}

      {message && (
        <div className="alert success-alert">
          {message}
        </div>
      )}

      {error && report && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <section className="version-selector">
        <div>
          <strong>Report versions</strong>
          <span>
            Select a previous submission to review
            its original content and comments.
          </span>
        </div>

        <div className="version-buttons">
          {report.versions.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                item.versionNumber ===
                version.versionNumber
                  ? "version-button active"
                  : "version-button"
              }
              onClick={() =>
                setSelectedVersion(
                  item.versionNumber,
                )
              }
            >
              Version {item.versionNumber}
            </button>
          ))}
        </div>
      </section>

      <section className="content-card detail-section">
        <div className="section-heading">
          <ListChecks size={20} />
          <div>
            <span>Work completed</span>
            <h2>Task-level progress</h2>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table task-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Priority</th>
                <th>Planned</th>
                <th>Actual</th>
                <th>Status</th>
                <th>Time</th>
                <th>Deliverable</th>
              </tr>
            </thead>

            <tbody>
              {version.completedTasks.map(
                (task) => (
                  <tr key={task.id}>
                    <td>
                      <strong>
                        {task.taskName}
                      </strong>
                    </td>
                    <td>
                      {readable(task.priority)}
                    </td>
                    <td>
                      {task.plannedPercentage}%
                    </td>
                    <td>
                      {task.actualPercentage}%
                    </td>
                    <td>
                      {readable(task.status)}
                    </td>
                    <td>
                      {formatMinutes(
                        task.spentMinutes,
                      )}{" "}
                      /{" "}
                      {formatMinutes(
                        task.plannedMinutes,
                      )}
                    </td>
                    <td>
                      {task.deliverable ?? "-"}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="report-content-grid">
        <section className="content-card detail-section">
          <div className="section-heading">
            <Clock3 size={20} />
            <div>
              <span>Forward planning</span>
              <h2>Next week</h2>
            </div>
          </div>

          <ul className="detail-list">
            {version.nextWeekTasks.map(
              (task) => (
                <li key={task.id}>
                  <strong>{task.taskName}</strong>
                  <span>
                    {readable(task.priority)}
                  </span>
                  {task.notes && (
                    <p>{task.notes}</p>
                  )}
                </li>
              ),
            )}
          </ul>
        </section>

        <section className="content-card detail-section">
          <div className="section-heading warning">
            <AlertTriangle size={20} />
            <div>
              <span>Risks and challenges</span>
              <h2>Blockers</h2>
            </div>
          </div>

          {version.blockers.length ? (
            <ul className="detail-list">
              {version.blockers.map(
                (blocker) => (
                  <li key={blocker.id}>
                    <strong>
                      {blocker.description}
                    </strong>

                    {blocker.isKeyIssue && (
                      <span>Key issue</span>
                    )}
                  </li>
                ),
              )}
            </ul>
          ) : (
            <p className="muted-text">
              No blockers were reported.
            </p>
          )}
        </section>

        <section className="content-card detail-section">
          <div className="section-heading success">
            <Trophy size={20} />
            <div>
              <span>Positive outcomes</span>
              <h2>Achievements</h2>
            </div>
          </div>

          <ul className="detail-list">
            {version.achievements.map(
              (achievement) => (
                <li key={achievement.id}>
                  <strong>
                    {achievement.description}
                  </strong>

                  {achievement.isKeyAchievement && (
                    <span>
                      Key achievement
                    </span>
                  )}
                </li>
              ),
            )}
          </ul>
        </section>

        <section className="content-card detail-section">
          <div className="section-heading">
            <Clock3 size={20} />
            <div>
              <span>Workload</span>
              <h2>Time breakdown</h2>
            </div>
          </div>

          <ul className="time-list">
            {version.timeEntries.map(
              (entry) => (
                <li key={entry.id}>
                  <span>
                    {readable(entry.category)}
                  </span>
                  <strong>
                    {formatMinutes(
                      entry.minutes,
                    )}
                  </strong>
                </li>
              ),
            )}
          </ul>
        </section>
      </div>

      <section className="content-card detail-section">
        <div className="section-heading">
          <MessageSquare size={20} />
          <div>
            <span>Version feedback</span>
            <h2>Review history</h2>
          </div>
        </div>

        {version.reviews.length ? (
          <div className="review-history">
            {version.reviews.map((review) => (
              <article key={review.id}>
                <div>
                  <strong>
                    {review.manager.fullName}
                  </strong>
                  <span>
                    {formatDate(
                      review.createdAt,
                    )}
                  </span>
                </div>

                <span
                  className={`status-badge ${
                    review.action === "APPROVED"
                      ? "approved"
                      : "needs_correction"
                  }`}
                >
                  {readable(review.action)}
                </span>

                <p>
                  {review.comment ??
                    "Report approved."}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-text">
            No manager review exists for this version.
          </p>
        )}
      </section>

      {isManager &&
        report.status === "SUBMITTED" && (
          <section className="manager-review-panel">
            <div>
              <p className="eyebrow">
                Manager decision
              </p>
              <h2>Review this submission</h2>
              <p>
                Approve the current version or return
                it with a clear correction comment.
              </p>
            </div>

            <textarea
              placeholder="Explain what should be corrected..."
              value={comment}
              onChange={(event) =>
                setComment(event.target.value)
              }
            />

            <div className="review-actions">
              <button
                type="button"
                className="secondary-danger-button"
                disabled={isReviewing}
                onClick={() =>
                  void handleReview(
                    "REQUEST_CHANGES",
                  )
                }
              >
                <AlertTriangle size={17} />
                Request changes
              </button>

              <button
                type="button"
                className="approval-button"
                disabled={isReviewing}
                onClick={() =>
                  void handleReview("APPROVED")
                }
              >
                <CheckCircle2 size={17} />
                Approve report
              </button>
            </div>
          </section>
        )}

      <div className="detail-footer-note">
        <Send size={16} />
        Viewing Version {version.versionNumber}
      </div>
    </main>
  );
}
