import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Info,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import "../styles/dashboard-insights.css";

export type SmartInsight = {
  id: string;
  type: "POSITIVE" | "WARNING" | "INFO";
  title: string;
  message: string;
};

export type AttentionMember = {
  userId: string;
  fullName: string;
  email: string;
  reportId: string | null;
  status: string;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
  project: {
    id: string;
    name: string;
    color: string | null;
  } | null;
};

type Props = {
  insights: SmartInsight[];
  attentionRequired: AttentionMember[];
};

const insightIcons = {
  POSITIVE: CheckCircle2,
  WARNING: AlertTriangle,
  INFO: Info,
};

function readableStatus(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function SmartDashboardInsights({
  insights,
  attentionRequired,
}: Props) {
  return (
    <section className="smart-dashboard-grid">
      <article className="content-card smart-insights-panel">
        <div className="smart-panel-heading">
          <div className="smart-heading-icon">
            <BrainCircuit size={23} />
          </div>

          <div>
            <span>Decision support</span>
            <h2>Smart team insights</h2>
            <p>Automatically generated from this week&apos;s reports.</p>
          </div>
        </div>

        <div className="insight-list">
          {insights.length > 0 ? (
            insights.map((insight) => {
              const Icon = insightIcons[insight.type];

              return (
                <div
                  className={`insight-item ${insight.type.toLowerCase()}`}
                  key={insight.id}
                >
                  <Icon size={19} />
                  <div>
                    <strong>{insight.title}</strong>
                    <p>{insight.message}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="smart-empty-message">
              No insights are available for the selected week.
            </p>
          )}
        </div>
      </article>

      <article className="content-card attention-panel">
        <div className="smart-panel-heading">
          <div className="smart-heading-icon danger">
            <ShieldAlert size={23} />
          </div>

          <div>
            <span>Priority queue</span>
            <h2>Attention required</h2>
            <p>Members ranked using report risk signals.</p>
          </div>
        </div>

        <div className="attention-list">
          {attentionRequired.length > 0 ? (
            attentionRequired.slice(0, 4).map((member) => (
              <div className="attention-item" key={member.userId}>
                <div className="risk-score-ring">
                  <strong>{member.riskScore}</strong>
                  <span>risk</span>
                </div>

                <div className="attention-copy">
                  <div className="attention-name-row">
                    <strong>{member.fullName}</strong>
                    <span
                      className={`risk-badge ${member.riskLevel.toLowerCase()}`}
                    >
                      {member.riskLevel}
                    </span>
                  </div>

                  <p>
                    {member.reasons[0] ?? readableStatus(member.status)}
                  </p>
                </div>

                {member.reportId ? (
                  <Link
                    className="attention-link"
                    to={`/reports/${member.reportId}`}
                    aria-label={`Open ${member.fullName}'s report`}
                  >
                    <ArrowRight size={18} />
                  </Link>
                ) : (
                  <span
                    className="attention-link disabled"
                    title="No report available"
                  >
                    <ArrowRight size={18} />
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="all-clear-state">
              <CheckCircle2 size={25} />
              <div>
                <strong>No high-priority concerns</strong>
                <p>The selected week has no reports requiring attention.</p>
              </div>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
