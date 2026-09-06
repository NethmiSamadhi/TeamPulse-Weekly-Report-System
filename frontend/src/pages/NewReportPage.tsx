import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, FilePlus2, Plus, Save, Send, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import "../styles/report-form.css";

type Project = { id: string; name: string; color: string | null };
type Priority = "LOW" | "MEDIUM" | "HIGH";
type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
type TimeCategory = "DEVELOPMENT" | "MEETINGS" | "DOCUMENTATION";

type CompletedTask = {
  taskName: string;
  priority: Priority;
  plannedPercentage: number;
  actualPercentage: number;
  status: TaskStatus;
  plannedMinutes: number;
  spentMinutes: number;
  deliverable: string;
};

type NextTask = { taskName: string; priority: Priority; notes: string };
type Blocker = { description: string; isKeyIssue: boolean; isResolved: boolean };
type Achievement = { description: string; isKeyAchievement: boolean };
type TimeEntry = { category: TimeCategory; minutes: number };

type EditableReport = {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: string;
  project: { id: string } | null;
  versions: Array<{
    versionNumber: number;
    optionalNotes: string | null;
    completedTasks: Array<{
      id: string;
      taskName: string;
      priority: Priority;
      plannedPercentage: number | string;
      actualPercentage: number | string;
      status: TaskStatus;
      plannedMinutes: number;
      spentMinutes: number;
      deliverable: string | null;
    }>;
    nextWeekTasks: Array<{
      id: string;
      taskName: string;
      priority: Priority;
      notes: string | null;
    }>;
    blockers: Array<Blocker & { id: string }>;
    achievements: Array<Achievement & { id: string }>;
    timeEntries: Array<TimeEntry & { id: string }>;
  }>;
};

const emptyTask = (): CompletedTask => ({
  taskName: "", priority: "MEDIUM", plannedPercentage: 100,
  actualPercentage: 0, status: "NOT_STARTED", plannedMinutes: 0,
  spentMinutes: 0, deliverable: "",
});
const emptyNextTask = (): NextTask => ({ taskName: "", priority: "MEDIUM", notes: "" });
const emptyBlocker = (): Blocker => ({ description: "", isKeyIssue: false, isResolved: false });
const emptyAchievement = (): Achievement => ({ description: "", isKeyAchievement: false });

function dateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function currentWeek() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: dateValue(monday), end: dateValue(sunday) };
}

export function NewReportPage() {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const isEditing = Boolean(reportId);
  const week = currentWeek();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [weekStart, setWeekStart] = useState(week.start);
  const [weekEnd, setWeekEnd] = useState(week.end);
  const [optionalNotes, setOptionalNotes] = useState("");
  const [tasks, setTasks] = useState<CompletedTask[]>([emptyTask()]);
  const [nextTasks, setNextTasks] = useState<NextTask[]>([emptyNextTask()]);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([emptyAchievement()]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    { category: "DEVELOPMENT", minutes: 0 },
    { category: "MEETINGS", minutes: 0 },
    { category: "DOCUMENTATION", minutes: 0 },
  ]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);

  useEffect(() => {
    async function loadPage() {
      try {
        const response = await api.get<{ data: { projects: Project[] } }>("/projects");
        setProjects(response.data.data.projects);
        if (!isEditing && response.data.data.projects.length) {
          setProjectId(response.data.data.projects[0].id);
        }

        if (reportId) {
          const reportResponse = await api.get<{ data: { report: EditableReport } }>(
            `/reports/${reportId}`,
          );
          const report = reportResponse.data.data.report;

          if (report.status !== "DRAFT" && report.status !== "NEEDS_CORRECTION") {
            setError("Only draft reports or reports needing correction can be edited.");
            return;
          }

          const version = report.versions.find(
            (item) => item.versionNumber === Math.max(...report.versions.map((item) => item.versionNumber)),
          ) ?? report.versions[0];

          setProjectId(report.project?.id ?? "");
          setWeekStart(report.weekStart.slice(0, 10));
          setWeekEnd(report.weekEnd.slice(0, 10));
          setOptionalNotes(version.optionalNotes ?? "");
          setTasks(version.completedTasks.length ? version.completedTasks.map(({ id: _id, ...task }) => ({
            ...task,
            plannedPercentage: Number(task.plannedPercentage),
            actualPercentage: Number(task.actualPercentage),
            deliverable: task.deliverable ?? "",
          })) : [emptyTask()]);
          setNextTasks(version.nextWeekTasks.length ? version.nextWeekTasks.map(({ id: _id, ...task }) => ({
            ...task,
            notes: task.notes ?? "",
          })) : [emptyNextTask()]);
          setBlockers(version.blockers.map(({ id: _id, ...blocker }) => blocker));
          setAchievements(version.achievements.length ? version.achievements.map(({ id: _id, ...achievement }) => achievement) : [emptyAchievement()]);
          setTimeEntries(version.timeEntries.length
            ? version.timeEntries.map(({ id: _id, ...entry }) => entry)
            : [
                { category: "DEVELOPMENT", minutes: 0 },
                { category: "MEETINGS", minutes: 0 },
                { category: "DOCUMENTATION", minutes: 0 },
              ]);
        }
      } catch {
        setError("The report editor could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    }
    void loadPage();
  }, [isEditing, reportId]);

  function updateItem<T>(items: T[], index: number, changes: Partial<T>, setter: (value: T[]) => void) {
    setter(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item));
  }

  function removeItem<T>(items: T[], index: number, setter: (value: T[]) => void) {
    setter(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function payload() {
    return {
      weekStart, weekEnd, projectId,
      optionalNotes: optionalNotes.trim() || undefined,
      completedTasks: tasks.filter((task) => task.taskName.trim()).map((task) => ({ ...task, taskName: task.taskName.trim(), deliverable: task.deliverable.trim() || undefined })),
      nextWeekTasks: nextTasks.filter((task) => task.taskName.trim()).map((task) => ({ ...task, taskName: task.taskName.trim(), notes: task.notes.trim() || undefined })),
      blockers: blockers.filter((item) => item.description.trim()).map((item) => ({ ...item, description: item.description.trim() })),
      achievements: achievements.filter((item) => item.description.trim()).map((item) => ({ ...item, description: item.description.trim() })),
      timeEntries,
    };
  }

  async function saveReport(submitAfterSaving: boolean) {
    if (!projectId) return setError("Select a project.");
    if (!tasks.some((task) => task.taskName.trim())) return setError("Add at least one completed or in-progress task.");
    setIsSaving(true);
    setError("");
    try {
      const response = isEditing
        ? await api.put<{ data: { report: { id: string } } }>(`/reports/${reportId}`, payload())
        : await api.post<{ data: { report: { id: string } } }>("/reports", payload());
      const savedReportId = response.data.data.report.id;
      if (submitAfterSaving) await api.post(`/reports/${savedReportId}/submit`);
      navigate(`/reports/${savedReportId}`);
    } catch (caught) {
      const apiMessage = (caught as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(apiMessage ?? "The report could not be saved. Check all required fields.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void saveReport(false);
  }

  if (isLoading) {
    return <main className="app-page"><section className="content-card form-section"><p>Loading report editor...</p></section></main>;
  }

  return (
    <main className="app-page report-form-page">
      <header className="report-form-header">
        <div>
          <p className="eyebrow">Team member workspace</p>
          <h1>{isEditing ? "Edit weekly report" : "Create weekly report"}</h1>
          <p>{isEditing ? "Update this report before submitting it for manager review." : "Capture your progress, outcomes, challenges and plan for the next week."}</p>
        </div>
        <div className="report-form-header-icon"><FilePlus2 size={27} /></div>
      </header>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <form onSubmit={handleSubmit}>
        <section className="content-card form-section">
          <div className="form-section-title"><CalendarDays size={20} /><div><span>Report period</span><h2>Week and project</h2></div></div>
          <div className="form-grid three-columns">
            <label><span>Week start</span><input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} required /></label>
            <label><span>Week end</span><input type="date" value={weekEnd} onChange={(e) => setWeekEnd(e.target.value)} required /></label>
            <label><span>Project</span><select value={projectId} onChange={(e) => setProjectId(e.target.value)} required><option value="">Select a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          </div>
        </section>

        <section className="content-card form-section">
          <FormTitle icon={<CheckCircle2 size={20} />} eyebrow="Progress" title="Completed tasks" onAdd={() => setTasks([...tasks, emptyTask()])} />
          <div className="repeatable-list">
            {tasks.map((task, index) => (
              <article className="repeatable-card" key={index}>
                <div className="repeatable-card-header"><strong>Task {index + 1}</strong>{tasks.length > 1 && <RemoveButton onClick={() => removeItem(tasks, index, setTasks)} />}</div>
                <div className="form-grid three-columns">
                  <label className="wide-field"><span>Task name</span><input value={task.taskName} onChange={(e) => updateItem(tasks, index, { taskName: e.target.value }, setTasks)} maxLength={200} required /></label>
                  <label><span>Priority</span><select value={task.priority} onChange={(e) => updateItem(tasks, index, { priority: e.target.value as Priority }, setTasks)}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></label>
                  <label><span>Status</span><select value={task.status} onChange={(e) => updateItem(tasks, index, { status: e.target.value as TaskStatus }, setTasks)}><option value="NOT_STARTED">Not started</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option></select></label>
                  <NumberField label="Planned %" value={task.plannedPercentage} max={100} onChange={(value) => updateItem(tasks, index, { plannedPercentage: value }, setTasks)} />
                  <NumberField label="Actual %" value={task.actualPercentage} max={100} onChange={(value) => updateItem(tasks, index, { actualPercentage: value }, setTasks)} />
                  <NumberField label="Planned minutes" value={task.plannedMinutes} onChange={(value) => updateItem(tasks, index, { plannedMinutes: value }, setTasks)} />
                  <NumberField label="Spent minutes" value={task.spentMinutes} onChange={(value) => updateItem(tasks, index, { spentMinutes: value }, setTasks)} />
                  <label className="wide-field"><span>Deliverable</span><input value={task.deliverable} onChange={(e) => updateItem(tasks, index, { deliverable: e.target.value }, setTasks)} placeholder="Link, document, feature or completed output" /></label>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="form-two-column">
          <section className="content-card form-section">
            <FormTitle icon={<CalendarDays size={20} />} eyebrow="Planning" title="Next week tasks" onAdd={() => setNextTasks([...nextTasks, emptyNextTask()])} />
            <div className="repeatable-list">{nextTasks.map((task, index) => <article className="repeatable-card compact" key={index}><div className="repeatable-card-header"><strong>Plan {index + 1}</strong>{nextTasks.length > 1 && <RemoveButton onClick={() => removeItem(nextTasks, index, setNextTasks)} />}</div><label><span>Task</span><input value={task.taskName} onChange={(e) => updateItem(nextTasks, index, { taskName: e.target.value }, setNextTasks)} /></label><label><span>Priority</span><select value={task.priority} onChange={(e) => updateItem(nextTasks, index, { priority: e.target.value as Priority }, setNextTasks)}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></label><label><span>Notes</span><textarea value={task.notes} onChange={(e) => updateItem(nextTasks, index, { notes: e.target.value }, setNextTasks)} /></label></article>)}</div>
          </section>

          <section className="content-card form-section">
            <FormTitle icon={<Clock3 size={20} />} eyebrow="Workload" title="Time breakdown" />
            <div className="time-entry-list">{timeEntries.map((entry, index) => <div className="time-entry" key={entry.category}><span>{entry.category.toLowerCase()}</span><div><input type="number" min="0" value={entry.minutes} onChange={(e) => updateItem(timeEntries, index, { minutes: Number(e.target.value) }, setTimeEntries)} /><small>minutes</small></div></div>)}</div>
          </section>
        </div>

        <div className="form-two-column">
          <section className="content-card form-section">
            <FormTitle icon={<Plus size={20} />} eyebrow="Challenges" title="Blockers" onAdd={() => setBlockers([...blockers, emptyBlocker()])} />
            {!blockers.length && <p className="form-empty">No blockers added. Add one only when something affected your progress.</p>}
            <div className="repeatable-list">{blockers.map((item, index) => <article className="repeatable-card compact" key={index}><div className="repeatable-card-header"><strong>Blocker {index + 1}</strong><RemoveButton onClick={() => removeItem(blockers, index, setBlockers)} /></div><label><span>Description</span><textarea value={item.description} onChange={(e) => updateItem(blockers, index, { description: e.target.value }, setBlockers)} /></label><div className="checkbox-row"><label><input type="checkbox" checked={item.isKeyIssue} onChange={(e) => setBlockers(blockers.map((blocker, itemIndex) => ({ ...blocker, isKeyIssue: itemIndex === index ? e.target.checked : false })))} /> Key issue</label><label><input type="checkbox" checked={item.isResolved} onChange={(e) => updateItem(blockers, index, { isResolved: e.target.checked }, setBlockers)} /> Resolved</label></div></article>)}</div>
          </section>

          <section className="content-card form-section">
            <FormTitle icon={<CheckCircle2 size={20} />} eyebrow="Outcomes" title="Achievements" onAdd={() => setAchievements([...achievements, emptyAchievement()])} />
            <div className="repeatable-list">{achievements.map((item, index) => <article className="repeatable-card compact" key={index}><div className="repeatable-card-header"><strong>Achievement {index + 1}</strong>{achievements.length > 1 && <RemoveButton onClick={() => removeItem(achievements, index, setAchievements)} />}</div><label><span>Description</span><textarea value={item.description} onChange={(e) => updateItem(achievements, index, { description: e.target.value }, setAchievements)} /></label><label className="checkbox-label"><input type="checkbox" checked={item.isKeyAchievement} onChange={(e) => setAchievements(achievements.map((achievement, itemIndex) => ({ ...achievement, isKeyAchievement: itemIndex === index ? e.target.checked : false })))} /> Mark as key achievement</label></article>)}</div>
          </section>
        </div>

        <section className="content-card form-section">
          <div className="form-section-title"><FilePlus2 size={20} /><div><span>Additional context</span><h2>Notes and links</h2></div></div>
          <label><span>Optional notes</span><textarea className="large-textarea" value={optionalNotes} onChange={(e) => setOptionalNotes(e.target.value)} maxLength={3000} placeholder="Add relevant links, dependencies, decisions or additional context..." /></label>
        </section>

        <div className="report-form-actions">
          <button className="secondary-form-button" type="submit" disabled={isSaving}><Save size={18} />{isSaving ? "Saving..." : isEditing ? "Save changes" : "Save draft"}</button>
          <button className="primary-form-button" type="button" disabled={isSaving} onClick={() => void saveReport(true)}><Send size={18} />{isEditing ? "Save and submit" : "Save and submit"}</button>
        </div>
      </form>
    </main>
  );
}

function FormTitle({ icon, eyebrow, title, onAdd }: { icon: ReactNode; eyebrow: string; title: string; onAdd?: () => void }) {
  return <div className="form-section-title"><div className="form-title-copy">{icon}<div><span>{eyebrow}</span><h2>{title}</h2></div></div>{onAdd && <button className="add-row-button" type="button" onClick={onAdd}><Plus size={16} />Add item</button>}</div>;
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return <button className="remove-row-button" type="button" onClick={onClick} aria-label="Remove item"><Trash2 size={16} /></button>;
}

function NumberField({ label, value, max, onChange }: { label: string; value: number; max?: number; onChange: (value: number) => void }) {
  return <label><span>{label}</span><input type="number" min="0" max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}
