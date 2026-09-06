import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Users,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import {
  SmartDashboardInsights,
  type AttentionMember,
  type SmartInsight,
} from "../components/SmartDashboardInsights";

type DashboardData = {
  selectedWeek: {
    start: string;
    end: string;
  };
  metrics: {
    totalTeamMembers: number;
    submittedReports: number;
    pendingReports: number;
    approvedReports: number;
    needsCorrection: number;
    openBlockers: number;
    completedTaskCount: number;
    complianceRate: number;
  };
  statusDistribution: {
    draft: number;
    submitted: number;
    needsCorrection: number;
    approved: number;
    notStarted: number;
  };
  statusByMember: Array<{
    userId: string;
    fullName: string;
    email: string;
    reportId: string | null;
    status: string;
    project: {
      id: string;
      name: string;
      color: string | null;
    } | null;
  }>;
  workloadByProject: Array<{
    projectId: string;
    projectName: string;
    color: string | null;
    taskCount: number;
    spentMinutes: number;
  }>;
  timeByCategory: Array<{
    category: string;
    minutes: number;
    hours: number;
  }>;
  insights: SmartInsight[];
  attentionRequired: AttentionMember[];
  recentActivity: Array<{
    id: string;
    action: string;
    entityId: string | null;
    createdAt: string;
    actor: {
      id: string;
      fullName: string;
      role: string;
    };
  }>;

type MemberReport = {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: string;
  project: {
    name: string;
    color: string | null;
  } | null;
};

const statusColours: Record<string, string> = {
  APPROVED: "#10b981",
  SUBMITTED: "#6366f1",
  NEEDS_CORRECTION: "#f59e0b",
  DRAFT: "#94a3b8",
  NOT_STARTED: "#e2e8f0",
};

function readableStatus(value: string) {
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
  }).format(new Date(value));
}

function MemberDashboard() {
  const [reports, setReports] = useState<
    MemberReport[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const response = await api.get<{
          data: {
            reports: MemberReport[];
          };
        }>("/reports?page=1&pageSize=5");

        setReports(response.data.data.reports);
      } finally {
        setIsLoading(false);
      }
    }

    void loadReports();
  }, []);

  const latestReport = reports[0];

  return (
    <main className="app-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">
            Personal workspace
          </p>
          <h1>My weekly pulse</h1>
          <p>
            Track your latest submission, feedback and
            reporting history.
          </p>
        </div>
      </header>

      {isLoading ? (
        <section className="content-card empty-state">
          <div className="loader-spinner" />
          <p>Loading your reports...</p>
        </section>
      ) : (
        <div className="dashboard-grid">
          <section className="metric-card">
            <FileText />
            <span>Total reports</span>
            <strong>{reports.length}</strong>
          </section>

          <section className="metric-card">
            <ClipboardCheck />
            <span>Latest status</span>
            <strong className="metric-status">
              {latestReport
                ? readableStatus(
                    latestReport.status,
                  )
                : "Not Started"}
            </strong>
          </section>

          <section className="content-card dashboard-panel wide-panel">
            <div className="panel-heading">
              <div>
                <span>Recent submission</span>
                <h2>
                  {latestReport?.project?.name ??
                    "No report created"}
                </h2>
              </div>
            </div>

            {latestReport ? (
              <div className="latest-report-card">
                <div>
                  <span>Reporting week</span>
                  <strong>
                    {formatDate(
                      latestReport.weekStart,
                    )}{" "}
                    -{" "}
                    {formatDate(
                      latestReport.weekEnd,
                    )}
                  </strong>
                </div>

                <span
                  className={`status-badge ${latestReport.status.toLowerCase()}`}
                >
                  {readableStatus(
                    latestReport.status,
                  )}
                </span>
              </div>
            ) : (
              <p className="muted-text">
                Create your first weekly report to begin.
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function ManagerDashboard() {
  const [weekStart, setWeekStart] =
    useState("2026-08-31");

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get<{
          success: boolean;
          data: DashboardData;
        }>("/dashboard", {
          params: {
            weekStart,
          },
        });

        setDashboard(response.data.data);
      } catch {
        setError(
          "Dashboard data could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, [weekStart]);

  const statusChartData = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return [
      {
        name: "Approved",
        value:
          dashboard.statusDistribution.approved,
        color: statusColours.APPROVED,
      },
      {
        name: "Submitted",
        value:
          dashboard.statusDistribution.submitted,
        color: statusColours.SUBMITTED,
      },
      {
        name: "Needs Correction",
        value:
          dashboard.statusDistribution
            .needsCorrection,
        color:
          statusColours.NEEDS_CORRECTION,
      },
      {
        name: "Draft",
        value:
          dashboard.statusDistribution.draft,
        color: statusColours.DRAFT,
      },
      {
        name: "Not Started",
        value:
          dashboard.statusDistribution.notStarted,
        color: statusColours.NOT_STARTED,
      },
    ];
  }, [dashboard]);

  if (isLoading) {
    return (
      <main className="app-page">
        <section className="content-card empty-state">
          <div className="loader-spinner" />
          <p>Building team insights...</p>
        </section>
      </main>
    );
  }

  if (error || !dashboard) {
    return (
      <main className="app-page">
        <div className="alert alert-error">
          {error}
        </div>
      </main>
    );
  }

  const { metrics } = dashboard;

  return (
    <main className="app-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">
            Manager overview
          </p>
          <h1>Team performance pulse</h1>
          <p>
            A consolidated view of submissions,
            workload, blockers and review progress.
          </p>
        </div>

        <label className="week-filter">
          <span>Week beginning</span>
          <input
            type="date"
            value={weekStart}
            onChange={(event) =>
              setWeekStart(event.target.value)
            }
          />
        </label>
      </header>

      <section className="dashboard-metrics">
        <article className="metric-card">
          <div className="metric-icon indigo">
            <Users size={21} />
          </div>
          <span>Team members</span>
          <strong>{metrics.totalTeamMembers}</strong>
        </article>

        <article className="metric-card">
          <div className="metric-icon green">
            <ClipboardCheck size={21} />
          </div>
          <span>Submitted</span>
          <strong>{metrics.submittedReports}</strong>
        </article>

        <article className="metric-card">
          <div className="metric-icon amber">
            <Clock3 size={21} />
          </div>
          <span>Needs correction</span>
          <strong>{metrics.needsCorrection}</strong>
        </article>

        <article className="metric-card">
          <div className="metric-icon red">
            <AlertTriangle size={21} />
          </div>
          <span>Open blockers</span>
          <strong>{metrics.openBlockers}</strong>
        </article>

        <article className="metric-card">
          <div className="metric-icon teal">
            <CheckCircle2 size={21} />
          </div>
          <span>Compliance</span>
          <strong>{metrics.complianceRate}%</strong>
        </article>
      </section>

      <SmartDashboardInsights
  insights={dashboard.insights}
  attentionRequired={dashboard.attentionRequired}
  />
      <section className="dashboard-panels">
        <article className="content-card dashboard-panel">
          <div className="panel-heading">
            <div>
              <span>Reporting progress</span>
              <h2>Status distribution</h2>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={4}
                >
                  {statusChartData.map((item) => (
                    <Cell
                      key={item.name}
                      fill={item.color}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-legend">
            {statusChartData.map((item) => (
              <span key={item.name}>
                <i
                  style={{
                    background: item.color,
                  }}
                />
                {item.name}: {item.value}
              </span>
            ))}
          </div>
        </article>

        <article className="content-card dashboard-panel">
          <div className="panel-heading">
            <div>
              <span>Team allocation</span>
              <h2>Hours by task type</h2>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={dashboard.timeByCategory}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e9edf4"
                />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <Tooltip />
                <Bar
                  dataKey="hours"
                  fill="#6366f1"
                  radius={[7, 7, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="content-card dashboard-panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>Submission tracking</span>
              <h2>Team reporting status</h2>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Team member</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Submission</th>
                </tr>
              </thead>

              <tbody>
                {dashboard.statusByMember.map(
                  (member) => (
                    <tr key={member.userId}>
                      <td>
                        <strong>
                          {member.fullName}
                        </strong>
                        <span>{member.email}</span>
                      </td>
                      <td>
                        {member.project?.name ??
                          "Not assigned"}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${member.status.toLowerCase()}`}
                        >
                          {readableStatus(
                            member.status,
                          )}
                        </span>
                      </td>
                      <td>
                        {member.reportId
                          ? "Report available"
                          : "Pending"}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "TEAM_MEMBER") {
    return <MemberDashboard />;
  }

  return <ManagerDashboard />;
}