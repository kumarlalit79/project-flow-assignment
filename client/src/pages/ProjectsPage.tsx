import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/axios";
import { useAuthStore } from "../store/auth.store";
import { useProjectStore } from "../store/project.store";
import { getSocket } from "../services/socket.service";
import { toast } from "sonner";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  Calendar,
  ArrowRight,
  Loader2,
  FolderKanban,
  X,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import EmptyState from "../components/common/EmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import type { Project } from "../types";

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
    <div className="h-5 bg-slate-200 rounded w-2/3 mb-3" />
    <div className="h-3 bg-slate-100 rounded w-full mb-1.5" />
    <div className="h-3 bg-slate-100 rounded w-4/5 mb-6" />
    <div className="flex items-center justify-between">
      <div className="h-3 bg-slate-100 rounded w-1/3" />
      <div className="h-8 bg-slate-100 rounded-lg w-24" />
    </div>
  </div>
);

// ─── Project Modal ─────────────────────────────────────────────────────────────
interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
  initialName?: string;
  initialDescription?: string;
  title: string;
  submitLabel: string;
}

const ProjectModal = ({
  open,
  onClose,
  onSubmit,
  initialName = "",
  initialDescription = "",
  title,
  submitLabel,
}: ProjectModalProps) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);

  // Sync when editing different project
  useEffect(() => {
    setName(initialName);
    setDescription(initialDescription);
  }, [initialName, initialDescription, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit(name.trim(), description.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors rounded-lg p-1 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              required
              autoFocus
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Three-dot Menu ────────────────────────────────────────────────────────────
interface CardMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

const CardMenu = ({ onEdit, onDelete }: CardMenuProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-slate-200 py-1 w-36 animate-scale-in">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onEdit(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onDelete(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Project Card ──────────────────────────────────────────────────────────────
interface ProjectCardProps {
  project: Project;
  isAdmin: boolean;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
  onOpen: (id: string) => void;
}

const ProjectCard = ({ project, isAdmin, onEdit, onDelete, onOpen }: ProjectCardProps) => {
  const memberCount = project.members?.length ?? 0;
  const formattedDate = new Date(project.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <FolderKanban className="h-4 w-4 text-blue-600" />
          </div>
          <h3 className="font-semibold text-slate-900 text-base leading-tight truncate">
            {project.name}
          </h3>
        </div>
        {isAdmin && (
          <CardMenu onEdit={() => onEdit(project)} onDelete={() => onDelete(project)} />
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-slate-500 line-clamp-2 mb-5 flex-1 leading-relaxed">
        {project.description || "No description provided."}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {formattedDate}
        </span>
      </div>

      {/* Open Board button */}
      <button
        onClick={() => onOpen(project._id)}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all duration-200 group-hover:shadow-sm"
      >
        Open Board
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

// ─── ProjectsPage ──────────────────────────────────────────────────────────────
const ProjectsPage = () => {
  const { user } = useAuthStore();
  const {
    projects,
    setProjects,
    addProject,
    updateProject,
    removeProject,
    updateProjectMembers,
  } = useProjectStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);

  // Edit modal
  const [editProject, setEditProject] = useState<Project | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch projects ────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const res = await api.get("/projects");
        if (mounted) setProjects(res.data.data ?? []);
      } catch {
        toast.error("Failed to load projects");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, [setProjects]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user?._id) return;

    const handleProjectDeleted = ({ projectId }: { projectId: string }) => {
      removeProject(projectId);
    };

    const handleMemberAdded = ({
      project,
      userId,
    }: {
      project: Project;
      userId: string;
    }) => {
      if (!project?._id) return;

      if (userId === user._id) {
        addProject(project);
        return;
      }

      updateProjectMembers(project._id, project.members ?? []);
    };

    socket.on("project:deleted", handleProjectDeleted);
    socket.on("member:added", handleMemberAdded);

    return () => {
      socket.off("project:deleted", handleProjectDeleted);
      socket.off("member:added", handleMemberAdded);
    };
  }, [user?._id, addProject, removeProject, updateProjectMembers]);

  // ── Create project ────────────────────────────────────────────────
  const handleCreate = async (name: string, description: string) => {
    try {
      const res = await api.post("/projects", { name, description });
      addProject(res.data.data);
      toast.success("Project created!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create project";
      toast.error(msg);
      throw err;
    }
  };

  // ── Edit project ──────────────────────────────────────────────────
  const handleEdit = async (name: string, description: string) => {
    if (!editProject) return;
    try {
      const res = await api.patch(`/projects/${editProject._id}`, { name, description });
      updateProject(res.data.data);
      toast.success("Project updated!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to update project";
      toast.error(msg);
      throw err;
    }
  };

  // ── Delete project ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/projects/${deleteTarget._id}`);
      removeProject(deleteTarget._id);
      toast.success("Project deleted");
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to delete project";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh" }} className="bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? "Loading…" : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {isAdmin && (
            <button
              id="new-project-btn"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          )}
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description={
              isAdmin
                ? "Create your first project to get started managing tasks."
                : "You haven't been added to any projects yet. Ask an admin to invite you."
            }
            actionLabel={isAdmin ? "Create Project" : undefined}
            onAction={isAdmin ? () => setShowCreate(true) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                isAdmin={isAdmin}
                onEdit={setEditProject}
                onDelete={setDeleteTarget}
                onOpen={(id) => navigate(`/projects/${id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create modal */}
      <ProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        title="Create New Project"
        submitLabel="Create Project"
      />

      {/* Edit modal */}
      <ProjectModal
        open={!!editProject}
        onClose={() => setEditProject(null)}
        onSubmit={handleEdit}
        initialName={editProject?.name}
        initialDescription={editProject?.description}
        title="Edit Project"
        submitLabel="Save Changes"
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Project"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Project"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default ProjectsPage;
