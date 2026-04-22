import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/axios";
import { useAuthStore } from "../store/auth.store";
import { useProjectStore } from "../store/project.store";
import { useTaskStore } from "../store/task.store";
import { useSocket } from "../hooks/useSocket";
import { getSocket } from "../services/socket.service";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Users, Calendar, Pencil, Trash2,
  Loader2, Wifi, CheckCircle2, Clock, Circle,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ConfirmDialog from "../components/common/ConfirmDialog";
import TaskModal from "../components/common/TaskModal";
import MembersModal from "../components/common/MembersModal";
import type { Task, Project, User, ProjectMember } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const priorityConfig = {
  low:    { label: "Low",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  medium: { label: "Medium", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  high:   { label: "High",   cls: "bg-red-50 text-red-600 border-red-200" },
};

const columnConfig = [
  { key: "todo",       label: "To Do",       accent: "bg-blue-500",  lightBg: "bg-blue-50",  icon: Circle },
  { key: "inProgress", label: "In Progress", accent: "bg-amber-500", lightBg: "bg-amber-50", icon: Clock },
  { key: "done",       label: "Done",        accent: "bg-emerald-500", lightBg: "bg-emerald-50", icon: CheckCircle2 },
] as const;

const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const isOverdue = (dueDate: string | null) =>
  dueDate ? new Date(dueDate) < new Date() : false;

// ─── Task Card ────────────────────────────────────────────────────────────────
interface TaskCardProps {
  task: Task;
  isManagerOrAbove: boolean;
  currentUserId: string;
  projectId: string;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
  isNew?: boolean;
  members: ProjectMember[];
}

const TaskCard = ({
  task, isManagerOrAbove, currentUserId, onEdit, onDelete, onStatusChange, isNew, members,
}: TaskCardProps) => {
  const prio = priorityConfig[task.priority] ?? priorityConfig.medium;
  const overdue = isOverdue(task.dueDate);

  // Resolve assignee name
  const assigneeUser = (() => {
    if (!task.assignee) return null;
    const assigneeId = typeof task.assignee === "string" ? task.assignee : (task.assignee as unknown as User)._id;
    const member = members.find((m) => {
      const u = m.user as User;
      return u?._id === assigneeId;
    });
    return member ? (member.user as User) : null;
  })();

  const assigneeId =
    typeof task.assignee === "string"
      ? task.assignee
      : (task.assignee as User | null)?._id;

  const canChangeStatus =
    isManagerOrAbove ||
    assigneeId === currentUserId;

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3 ${isNew ? "task-flash" : ""}`}
    >
      {/* Priority + Title */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border mb-2 ${prio.cls}`}>
            {prio.label}
          </span>
          <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{task.title}</p>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      {/* Assignee + Due date */}
      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
        {assigneeUser ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold">
              {initials(assigneeUser.name)}
            </div>
            <span className="text-slate-600 truncate max-w-[80px]">{assigneeUser.name}</span>
          </div>
        ) : (
          <span className="text-slate-300 italic">Unassigned</span>
        )}

        {task.dueDate && (
          <span className={`flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : "text-slate-400"}`}>
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      {/* Status + Actions */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
        {canChangeStatus ? (
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task._id, e.target.value as Task["status"])}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer flex-1 max-w-[130px]"
          >
            <option value="todo">To Do</option>
            <option value="inProgress">In Progress</option>
            <option value="done">Done</option>
          </select>
        ) : (
          <div />
        )}

        {isManagerOrAbove && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(task)}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── TaskBoardPage ─────────────────────────────────────────────────────────────
export default function TaskBoardPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentProject, setCurrentProject, updateProjectMembers, removeProject } = useProjectStore();
  const { tasks, setTasks, updateTask } = useTaskStore();

  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [liveFlash, setLiveFlash] = useState(false);
  const [newTaskIds, setNewTaskIds] = useState<Set<string>>(new Set());

  // Modal states
  const [showAddTask, setShowAddTask] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  // Track live updates
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Role checks ─────────────────────────────────────────────────
  const isAdmin = user?.role === "admin";
  const myProjectRole = currentProject?.members?.find((m) => {
    const u = m.user as User;
    return (u?._id ?? m.user) === user?._id;
  })?.role;
  const isManagerOrAbove = isAdmin || myProjectRole === "manager";

  // ── Socket real-time ─────────────────────────────────────────────
  useSocket(projectId);

  // ── Fetch project + tasks ────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    let mounted = true;

    const init = async () => {
      try {
        const [projRes, tasksRes] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/projects/${projectId}/tasks`),
        ]);
        if (!mounted) return;
        setCurrentProject(projRes.data.data);
        setTasks(tasksRes.data.data ?? []);
      } catch {
        toast.error("Failed to load board");
        navigate("/projects");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => { mounted = false; };
  }, [projectId, setCurrentProject, setTasks, navigate]);

  // ── Fetch all users (admin only, for member assignment) ──────────
  useEffect(() => {
    if (!isAdmin) return;
    api.get("/users").then((res) => setAllUsers(res.data.data ?? [])).catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    if (!projectId) return;

    const socket = getSocket();
    if (!socket) return;

    const handleProjectDeleted = ({ projectId: deletedProjectId }: { projectId: string }) => {
      if (deletedProjectId !== projectId) return;
      removeProject(deletedProjectId);
      toast.error("This project was deleted");
      navigate("/projects");
    };

    const handleMemberAdded = ({
      project,
    }: {
      project: Project;
    }) => {
      if (project?._id !== projectId) return;
      setCurrentProject(project);
      updateProjectMembers(project._id, project.members ?? []);
    };

    socket.on("project:deleted", handleProjectDeleted);
    socket.on("member:added", handleMemberAdded);

    return () => {
      socket.off("project:deleted", handleProjectDeleted);
      socket.off("member:added", handleMemberAdded);
    };
  }, [projectId, navigate, removeProject, setCurrentProject, updateProjectMembers]);

  // ── Flash live indicator ─────────────────────────────────────────
  const triggerLiveFlash = useCallback(() => {
    setLiveFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setLiveFlash(false), 2000);
  }, []);

  // ── Create task ──────────────────────────────────────────────────
  const handleCreateTask = async (data: Partial<{ title: string; description: string; priority: Task["priority"]; assignee: string; dueDate: string; status: Task["status"] }>) => {
    try {
      const payload = {
        title: data.title?.trim() ?? "",
        description: data.description?.trim() ?? "",
        priority: data.priority ?? "medium",
        assignee: data.assignee || undefined,
        dueDate: data.dueDate || undefined,
        status: data.status ?? "todo",
      };
      const res = await api.post(`/projects/${projectId}/tasks`, payload);
      const created: Task = res.data.data;
      // Socket will add it; but also mark as new for flash
      setNewTaskIds((prev) => new Set(prev).add(created._id));
      setTimeout(() => setNewTaskIds((prev) => { const s = new Set(prev); s.delete(created._id); return s; }), 1200);
      toast.success("Task created!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create task";
      toast.error(msg);
      throw err;
    }
  };

  // ── Edit task ────────────────────────────────────────────────────
  const handleEditTask = async (data: Partial<{ title: string; description: string; priority: Task["priority"]; assignee: string; dueDate: string; status: Task["status"] }>) => {
    if (!editTask) return;
    try {
      const res = await api.patch(`/projects/${projectId}/tasks/${editTask._id}`, data);
      updateTask(res.data.data);
      toast.success("Task updated!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to update task";
      toast.error(msg);
      throw err;
    }
  };

  // ── Delete task ──────────────────────────────────────────────────
  const handleDeleteTask = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/projects/${projectId}/tasks/${deleteTarget._id}`);
      toast.success("Task deleted");
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to delete task";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // ── Status change ────────────────────────────────────────────────
  const handleStatusChange = async (taskId: string, status: Task["status"]) => {
    try {
      const res = await api.patch(`/projects/${projectId}/tasks/${taskId}/status`, { status });
      updateTask(res.data.data);
      triggerLiveFlash();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to update status";
      toast.error(msg);
    }
  };

  // ── Members updated ──────────────────────────────────────────────
  const handleMembersUpdated = (updated: Project) => {
    setCurrentProject(updated);
  };

  const members = currentProject?.members ?? [];

  if (loading) return <><Navbar /><LoadingSpinner fullPage /></>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col">
        {/* ── Board Header ─────────────────────────────────────── */}
        <div className="bg-white border-b border-slate-200 px-6 lg:px-8 py-4">
          <div className="max-w-screen-xl mx-auto">
            {/* Top row */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/projects")}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 leading-tight">
                    {currentProject?.name ?? "Board"}
                  </h1>
                  {currentProject?.description && (
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                      {currentProject.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Live indicator */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 ${liveFlash ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  <Wifi className={`h-3 w-3 ${liveFlash ? "text-emerald-500" : "text-slate-400"}`} />
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse-dot ${liveFlash ? "bg-emerald-500" : "bg-slate-400"}`} />
                  Live
                </div>

                <button
                  id="members-btn"
                  onClick={() => setShowMembers(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Members</span>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    {members.length}
                  </span>
                </button>

                {isManagerOrAbove && (
                  <button
                    id="add-task-btn"
                    onClick={() => setShowAddTask(true)}
                    className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Task</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Kanban Board ─────────────────────────────────────── */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-5 p-6 lg:p-8 min-w-max max-w-screen-xl mx-auto">
            {columnConfig.map(({ key, label, accent, lightBg, icon: Icon }) => {
              const colTasks = tasks.filter((t) => t.status === key);

              return (
                <div key={key} className="flex flex-col w-72 sm:w-80 flex-shrink-0">
                  {/* Column header */}
                  <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl ${lightBg} mb-3`}>
                    <div className={`w-2 h-2 rounded-full ${accent}`} />
                    <Icon className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                    <span className={`ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white ${accent}`}>
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Task cards */}
                  <div className="flex flex-col gap-3 min-h-[200px]">
                    {colTasks.map((task) => (
                      <div key={task._id} className="animate-slide-in-top">
                        <TaskCard
                          task={task}
                          isManagerOrAbove={isManagerOrAbove}
                          currentUserId={user?._id ?? ""}
                          projectId={projectId ?? ""}
                          onEdit={setEditTask}
                          onDelete={setDeleteTarget}
                          onStatusChange={handleStatusChange}
                          isNew={newTaskIds.has(task._id)}
                          members={members}
                        />
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-300 rounded-xl border-2 border-dashed border-slate-200">
                        <Icon className="h-7 w-7 mb-2" />
                        <p className="text-xs font-medium">No tasks</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}
      <TaskModal
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        onSubmit={handleCreateTask}
        members={members}
        title="Add New Task"
      />

      <TaskModal
        open={!!editTask}
        onClose={() => setEditTask(null)}
        onSubmit={handleEditTask}
        members={members}
        editTask={editTask}
        title="Edit Task"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Task"
        description={`Delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Task"
        loading={deleting}
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteTarget(null)}
      />

      <MembersModal
        open={showMembers}
        onClose={() => setShowMembers(false)}
        project={currentProject!}
        currentUserId={user?._id ?? ""}
        isManagerOrAbove={isManagerOrAbove}
        onMembersUpdated={handleMembersUpdated}
        allUsers={allUsers}
      />
    </div>
  );
}
