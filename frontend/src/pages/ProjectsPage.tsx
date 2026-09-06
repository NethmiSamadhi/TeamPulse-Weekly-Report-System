import { type FormEvent, useEffect, useState } from "react";
import { Archive, FileText, FolderKanban, Pencil, Plus, Users, X } from "lucide-react";
import { api } from "../lib/api";
import "../styles/projects.css";

type Project = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { members: number; reports: number };
};

const colors = ["#6366F1", "#0EA5E9", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"];

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadProjects() {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get<{ data: { projects: Project[] } }>("/projects");
      setProjects(response.data.data.projects);
    } catch {
      setError("Projects could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void loadProjects(); }, []);

  function openCreateForm() {
    setEditingProject(null);
    setName("");
    setDescription("");
    setColor(colors[0]);
    setError("");
    setMessage("");
    setIsFormOpen(true);
  }

  function openEditForm(project: Project) {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description ?? "");
    setColor(project.color ?? colors[0]);
    setError("");
    setMessage("");
    setIsFormOpen(true);
  }

  function closeForm() {
    if (!isSaving) setIsFormOpen(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);
    const body = { name: name.trim(), description: description.trim() || undefined, color };
    try {
      if (editingProject) {
        await api.patch(`/projects/${editingProject.id}`, body);
        setMessage("Project updated successfully.");
      } else {
        await api.post("/projects", body);
        setMessage("Project created successfully.");
      }
      setIsFormOpen(false);
      await loadProjects();
    } catch (caught) {
      const apiMessage = (caught as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(apiMessage ?? "The project could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function archiveProject(project: Project) {
    const confirmed = window.confirm(`Archive “${project.name}”? Existing reports will remain available.`);
    if (!confirmed) return;
    setError("");
    setMessage("");
    try {
      await api.delete(`/projects/${project.id}`);
      setMessage(`${project.name} was archived.`);
      await loadProjects();
    } catch (caught) {
      const apiMessage = (caught as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(apiMessage ?? "The project could not be archived.");
    }
  }

  return (
    <main className="app-page projects-page">
      <header className="projects-header">
        <div><p className="eyebrow">Project management</p><h1>Projects</h1><p>Create, organise and monitor the workspaces used by your team.</p></div>
        <button className="primary-project-button" type="button" onClick={openCreateForm}><Plus size={18} />New project</button>
      </header>

      {message && <div className="alert project-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <section className="project-overview">
        <article><FolderKanban size={20} /><div><span>Active projects</span><strong>{projects.length}</strong></div></article>
        <article><Users size={20} /><div><span>Member assignments</span><strong>{projects.reduce((sum, project) => sum + project._count.members, 0)}</strong></div></article>
        <article><FileText size={20} /><div><span>Project reports</span><strong>{projects.reduce((sum, project) => sum + project._count.reports, 0)}</strong></div></article>
      </section>

      {isLoading ? (
        <section className="content-card projects-empty">Loading projects...</section>
      ) : projects.length ? (
        <section className="projects-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.id}>
              <div className="project-card-accent" style={{ background: project.color ?? colors[0] }} />
              <div className="project-card-heading">
                <div className="project-symbol" style={{ color: project.color ?? colors[0], background: `${project.color ?? colors[0]}18` }}><FolderKanban size={22} /></div>
                <span className="active-project-badge">Active</span>
              </div>
              <h2>{project.name}</h2>
              <p>{project.description || "No project description has been added."}</p>
              <div className="project-card-stats">
                <span><Users size={16} /><strong>{project._count.members}</strong> members</span>
                <span><FileText size={16} /><strong>{project._count.reports}</strong> reports</span>
              </div>
              <div className="project-card-actions">
                <button type="button" onClick={() => openEditForm(project)}><Pencil size={16} />Edit</button>
                <button className="archive-button" type="button" onClick={() => void archiveProject(project)}><Archive size={16} />Archive</button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="content-card projects-empty"><FolderKanban size={34} /><h2>No active projects</h2><p>Create the first project for your team.</p><button className="primary-project-button" type="button" onClick={openCreateForm}><Plus size={18} />New project</button></section>
      )}

      {isFormOpen && (
        <div className="project-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <section className="project-modal" role="dialog" aria-modal="true" aria-labelledby="project-form-title">
            <div className="project-modal-header"><div><p className="eyebrow">{editingProject ? "Update workspace" : "New workspace"}</p><h2 id="project-form-title">{editingProject ? "Edit project" : "Create project"}</h2></div><button type="button" onClick={closeForm} aria-label="Close project form"><X size={20} /></button></div>
            <form onSubmit={handleSubmit}>
              <label><span>Project name</span><input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required autoFocus /></label>
              <label><span>Description</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} placeholder="Describe the project purpose and expected work..." /></label>
              <fieldset><legend>Project colour</legend><div className="project-colors">{colors.map((option) => <button key={option} className={color === option ? "selected" : ""} style={{ background: option }} type="button" onClick={() => setColor(option)} aria-label={`Select ${option}`} />)}</div></fieldset>
              <div className="project-modal-actions"><button className="cancel-project-button" type="button" onClick={closeForm}>Cancel</button><button className="primary-project-button" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : editingProject ? "Save changes" : "Create project"}</button></div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
