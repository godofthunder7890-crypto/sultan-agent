import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Plus, FolderOpen, Trash2, Github, Settings, Clock, ExternalLink } from "lucide-react";
import { getProjects, createProject, deleteProject, Project } from "@/lib/firebase";

function formatDate(ts: { toDate?: () => Date } | null | undefined): string {
  if (!ts) return "—";
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date();
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ProjectsPage() {
  const [, setLocation] = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", githubRepo: "", description: "" });
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const ps = await getProjects();
      setProjects(ps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Project name is required");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const id = await createProject({
        name: form.name.trim(),
        githubRepo: form.githubRepo.trim(),
        description: form.description.trim(),
      });
      setLocation(`/studio/${id}`);
    } catch (e) {
      setError("Failed to create project. Check Firebase config in Settings.");
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProject(id);
      setProjects((ps) => ps.filter((p) => p.id !== id));
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="h-12 border-b border-border flex items-center px-5 gap-3">
        <span className="font-mono text-sm font-semibold tracking-tight text-primary text-glow-cyan">
          Sultan Studio
        </span>
        <div className="h-4 w-px bg-border" />
        <span className="text-sm text-muted-foreground">Projects</span>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/settings" data-testid="link-settings">
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
              data-testid="button-settings"
            >
              <Settings size={14} />
              Settings
            </button>
          </Link>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity glow-cyan"
            data-testid="button-new-project"
          >
            <Plus size={14} />
            New Project
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center">
              <FolderOpen size={20} className="text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">No projects yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first project to get started</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity glow-cyan"
              data-testid="button-create-first-project"
            >
              <Plus size={14} />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </h2>
            {projects.map((p) => (
              <div
                key={p.id}
                className="group flex items-center gap-4 px-4 py-3 bg-card border border-border rounded-lg hover:border-primary/40 hover:bg-card transition-all cursor-pointer"
                data-testid={`card-project-${p.id}`}
                onClick={() => setLocation(`/studio/${p.id}`)}
              >
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                  <FolderOpen size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate">{p.name}</span>
                    {p.githubRepo && (
                      <span className="text-xs text-muted-foreground font-mono truncate">
                        {p.githubRepo}
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock size={11} />
                  {formatDate(p.updatedAt)}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {p.githubRepo && (
                    <a
                      href={`https://github.com/${p.githubRepo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      data-testid={`link-github-${p.id}`}
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(p.id);
                    }}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    data-testid={`button-delete-project-${p.id}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-base font-semibold mb-4">New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Project Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="my-awesome-project"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  data-testid="input-project-name"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">GitHub Repo</label>
                <div className="relative">
                  <Github size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={form.githubRepo}
                    onChange={(e) => setForm((f) => ({ ...f, githubRepo: e.target.value }))}
                    placeholder="owner/repository"
                    className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                    data-testid="input-github-repo"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Optional — for GitHub sync</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What is this project about?"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  data-testid="input-project-description"
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setError("");
                    setForm({ name: "", githubRepo: "", description: "" });
                  }}
                  className="flex-1 px-3 py-2 border border-border rounded text-sm hover:bg-muted transition-colors"
                  data-testid="button-cancel-create"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 glow-cyan"
                  data-testid="button-submit-create"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h2 className="text-base font-semibold mb-2">Delete Project?</h2>
            <p className="text-sm text-muted-foreground mb-5">
              This will delete all files and chat history. This cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-3 py-2 border border-border rounded text-sm hover:bg-muted transition-colors"
                data-testid="button-cancel-delete"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1 px-3 py-2 bg-destructive text-destructive-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity"
                data-testid="button-confirm-delete"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
