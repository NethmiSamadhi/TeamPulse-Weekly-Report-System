import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, FileClock, Mail, Search, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import "../styles/team-members.css";

type MemberStatus = {
  userId: string;
  fullName: string;
  email: string;
  reportId: string | null;
  project: { id: string; name: string; color: string | null } | null;
  status: string;
  submittedAt: string | null;
};

type DashboardResponse = {
  data: {
    selectedWeek: { start: string; end: string };
    metrics: {
      totalTeamMembers: number;
      submittedReports: number;
      pendingReports: number;
      approvedReports: number;
      complianceRate: number;
    };
    statusByMember: MemberStatus[];
  };
};

function mondayValue(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1));
  return copy.toISOString().slice(0, 10);
}

function readable(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

export function TeamMembersPage() {
  const [weekStart, setWeekStart] = useState(mondayValue());
  const [members, setMembers] = useState<MemberStatus[]>([]);
  const [metrics, setMetrics] = useState<DashboardResponse["data"]["metrics"] | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMembers() {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get<DashboardResponse>(`/dashboard?weekStart=${weekStart}`);
        setMembers(response.data.data.statusByMember);
        setMetrics(response.data.data.metrics);
      } catch {
        setError("Team member data could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    }
    void loadMembers();
  }, [weekStart]);

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return members.filter((member) => {
      const matchesSearch = !term || member.fullName.toLowerCase().includes(term) || member.email.toLowerCase().includes(term) || member.project?.name.toLowerCase().includes(term);
      return matchesSearch && (status === "ALL" || member.status === status);
    });
  }, [members, search, status]);

  return (
    <main className="app-page team-page">
      <header className="team-header">
        <div><p className="eyebrow">Team management</p><h1>Team members</h1><p>Track every contributor’s weekly reporting status and current project.</p></div>
        <label className="team-week-picker"><span>Week beginning</span><div><CalendarDays size={17} /><input type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} /></div></label>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="team-metrics">
        <article><div className="team-metric-icon purple"><Users size={20} /></div><span>Team members</span><strong>{metrics?.totalTeamMembers ?? 0}</strong></article>
        <article><div className="team-metric-icon green"><CheckCircle2 size={20} /></div><span>Submitted</span><strong>{metrics?.submittedReports ?? 0}</strong></article>
        <article><div className="team-metric-icon orange"><FileClock size={20} /></div><span>Pending</span><strong>{metrics?.pendingReports ?? 0}</strong></article>
        <article><div className="team-metric-icon blue"><CheckCircle2 size={20} /></div><span>Compliance</span><strong>{metrics?.complianceRate ?? 0}%</strong></article>
      </section>

      <section className="content-card team-directory">
        <div className="team-directory-header">
          <div><p className="eyebrow">Weekly directory</p><h2>Reporting status</h2></div>
          <div className="team-filters">
            <label className="team-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search members..." /></label>
            <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All statuses</option><option value="DRAFT">Draft</option><option value="SUBMITTED">Submitted</option><option value="NEEDS_CORRECTION">Needs correction</option><option value="APPROVED">Approved</option><option value="NOT_STARTED">Not started</option></select>
          </div>
        </div>

        {isLoading ? <div className="team-empty">Loading team members...</div> : filteredMembers.length ? (
          <div className="team-table-wrapper"><table className="team-table"><thead><tr><th>Team member</th><th>Project</th><th>Weekly status</th><th>Submitted</th><th>Report</th></tr></thead><tbody>{filteredMembers.map((member) => <tr key={member.userId}><td><div className="member-identity"><div className="member-avatar">{initials(member.fullName)}</div><div><strong>{member.fullName}</strong><span><Mail size={13} />{member.email}</span></div></div></td><td>{member.project ? <div className="member-project"><i style={{ background: member.project.color ?? "#6366F1" }} />{member.project.name}</div> : <span className="muted-cell">Not assigned</span>}</td><td><span className={`status-badge ${member.status.toLowerCase()}`}>{readable(member.status)}</span></td><td>{member.submittedAt ? new Date(member.submittedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : <span className="muted-cell">Not submitted</span>}</td><td>{member.reportId ? <Link className="view-member-report" to={`/reports/${member.reportId}`}>View report</Link> : <span className="muted-cell">No report</span>}</td></tr>)}</tbody></table></div>
        ) : <div className="team-empty"><Users size={30} /><strong>No matching team members</strong><span>Try changing the search or status filter.</span></div>}
      </section>
    </main>
  );
}
