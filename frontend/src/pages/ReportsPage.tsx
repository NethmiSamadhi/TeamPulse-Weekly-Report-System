import {
  CalendarDays,
  Eye,
  Filter,
  Search,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import "../styles/reports.css";

type Report = {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: string;
  currentVersionNumber: number;
  submittedAt: string | null;
  updatedAt: string;
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
  _count: {
    versions: number;
  };
};

type Project = {
  id: string;
  name: string;
  color: string | null;
};

type MemberOption = {
  id: string;
  fullName: string;
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

export function ReportsPage() {
  const { user } = useAuth();

  const [reports, setReports] = useState<
    Report[]
  >([]);

  const [projects, setProjects] = useState<
    Project[]
  >([]);

  const [members, setMembers] = useState<
    MemberOption[]
  >([]);

  const [status, setStatus] = useState("");
  const [projectId, setProjectId] = useState("");
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState("");

  const isManager =
    user?.role === "MANAGER" ||
    user?.role === "ADMIN";

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const projectResponse = await api.get<{
          data: {
            projects: Project[];
          };
        }>("/projects");

        setProjects(
          projectResponse.data.data.projects,
        );

        if (isManager) {
          const reportResponse = await api.get<{
            data: {
              reports: Report[];
            };
          }>("/reports", {
            params: {
              pageSize: 50,
            },
          });

          const uniqueMembers = Array.from(
            new Map(
              reportResponse.data.data.reports.map(
                (report) => [
                  report.user.id,
                  {
                    id: report.user.id,
                    fullName:
                      report.user.fullName,
                  },
                ],
              ),
            ).values(),
          );

          setMembers(uniqueMembers);
        }
      } catch {
        setError(
          "Report filters could not be loaded.",
        );
      }
    }

    void loadFilterOptions();
  }, [isManager]);

  useEffect(() => {
    async function loadReports() {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get<{
          data: {
            reports: Report[];
            pagination: {
              total: number;
            };
          };
        }>("/reports", {
          params: {
            page: 1,
            pageSize: 50,
            status: status || undefined,
            projectId:
              projectId || undefined,
            userId:
              isManager && userId
                ? userId
                : undefined,
            from: from || undefined,
            to: to || undefined,
          },
        });

        setReports(
          response.data.data.reports,
        );
      } catch {
        setError(
          "Reports could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadReports();
  }, [
    status,
    projectId,
    userId,
    from,
    to,
    isManager,
  ]);

  const visibleReports = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    if (!normalizedSearch) {
      return reports;
    }

    return reports.filter((report) =>
      [
        report.user.fullName,
        report.user.email,
        report.project?.name ?? "",
        report.status,
      ].some((value) =>
        value
          .toLowerCase()
          .includes(normalizedSearch),
      ),
    );
  }, [reports, search]);

  function clearFilters() {
    setStatus("");
    setProjectId("");
    setUserId("");
    setFrom("");
    setTo("");
    setSearch("");
  }

  return (
    <main className="app-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">
            {isManager
              ? "Team reporting"
              : "Personal history"}
          </p>

          <h1>
            {isManager
              ? "Team weekly reports"
              : "My report history"}
          </h1>

          <p>
            Filter submissions, track workflow status
            and open complete version histories.
          </p>
        </div>

        {!isManager && (
          <Link
            className="primary-button"
            to="/reports/new"
          >
            Create report
          </Link>
        )}
      </header>

      <section className="content-card report-filters">
        <div className="filter-title">
          <Filter size={18} />
          <strong>Report filters</strong>
          <button
            type="button"
            onClick={clearFilters}
          >
            Clear all
          </button>
        </div>

        <div className="filter-grid">
          <label className="search-field">
            <Search size={17} />
            <input
              placeholder="Search reports..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </label>

          {isManager && (
            <select
              value={userId}
              onChange={(event) =>
                setUserId(event.target.value)
              }
            >
              <option value="">
                All team members
              </option>

              {members.map((member) => (
                <option
                  key={member.id}
                  value={member.id}
                >
                  {member.fullName}
                </option>
              ))}
            </select>
          )}

          <select
            value={projectId}
            onChange={(event) =>
              setProjectId(event.target.value)
            }
          >
            <option value="">All projects</option>

            {projects.map((project) => (
              <option
                key={project.id}
                value={project.id}
              >
                {project.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">
              Submitted
            </option>
            <option value="NEEDS_CORRECTION">
              Needs Correction
            </option>
            <option value="APPROVED">
              Approved
            </option>
          </select>

          <label className="date-filter">
            <span>From</span>
            <input
              type="date"
              value={from}
              onChange={(event) =>
                setFrom(event.target.value)
              }
            />
          </label>

          <label className="date-filter">
            <span>To</span>
            <input
              type="date"
              value={to}
              onChange={(event) =>
                setTo(event.target.value)
              }
            />
          </label>
        </div>
      </section>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="report-result-heading">
        <div>
          <strong>
            {visibleReports.length} reports
          </strong>
          <span>
            Matching the selected filters
          </span>
        </div>

        <CalendarDays size={20} />
      </div>

      {isLoading ? (
        <section className="content-card empty-state">
          <div className="loader-spinner" />
          <p>Loading weekly reports...</p>
        </section>
      ) : visibleReports.length === 0 ? (
        <section className="content-card empty-state">
          <span>No results</span>
          <h2>No reports found</h2>
          <p>
            Change the filters or create a new report.
          </p>
        </section>
      ) : (
        <section className="content-card reports-table-card">
          <div className="table-wrapper">
            <table className="data-table reports-table">
              <thead>
                <tr>
                  {isManager && (
                    <th>Team member</th>
                  )}
                  <th>Reporting week</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Last updated</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {visibleReports.map((report) => (
                  <tr key={report.id}>
                    {isManager && (
                      <td>
                        <strong>
                          {report.user.fullName}
                        </strong>
                        <span>
                          {report.user.email}
                        </span>
                      </td>
                    )}

                    <td>
                      {formatDate(
                        report.weekStart,
                      )}{" "}
                      -{" "}
                      {formatDate(
                        report.weekEnd,
                      )}
                    </td>

                    <td>
                      <span className="project-cell">
                        <i
                          style={{
                            background:
                              report.project?.color ??
                              "#94a3b8",
                          }}
                        />
                        {report.project?.name ??
                          "Unassigned"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${report.status.toLowerCase()}`}
                      >
                        {readableStatus(
                          report.status,
                        )}
                      </span>
                    </td>

                    <td>
                      Version{" "}
                      {report.currentVersionNumber}
                    </td>

                    <td>
                      {formatDate(
                        report.updatedAt,
                      )}
                    </td>

                    <td>
                      <Link
                        className="view-report-link"
                        to={`/reports/${report.id}`}
                      >
                        <Eye size={16} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}