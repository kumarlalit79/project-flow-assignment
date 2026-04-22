import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import type { Task, ProjectMember, User } from "../../types";

interface TaskFormData {
  title: string;
  description: string;
  priority: Task["priority"];
  assignee: string;
  dueDate: string;
  status: Task["status"];
}

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<TaskFormData>) => Promise<void>;
  members: ProjectMember[];
  editTask?: Task | null;
  title: string;
}

const createDefaultForm = (): TaskFormData => ({
  title: "",
  description: "",
  priority: "medium",
  assignee: "",
  dueDate: "",
  status: "todo",
});

const TaskModal = ({ open, onClose, onSubmit, members, editTask, title }: TaskModalProps) => {
  const [form, setForm] = useState<TaskFormData>(createDefaultForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editTask) {
      setForm({
        title: editTask.title ?? "",
        description: editTask.description ?? "",
        priority: editTask.priority ?? "medium",
        assignee: typeof editTask.assignee === "string"
          ? editTask.assignee
          : (editTask.assignee as unknown as User)?._id ?? "",
        dueDate: editTask.dueDate ? editTask.dueDate.slice(0, 10) : "",
        status: editTask.status ?? "todo",
      });
    } else {
      setForm(createDefaultForm());
    }
  }, [editTask, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Partial<TaskFormData> = {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        assignee: form.assignee || undefined,
        dueDate: form.dueDate || undefined,
      };
      if (editTask) payload.status = form.status;
      await onSubmit(payload);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof TaskFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const inputCls = "w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input type="text" value={form.title} onChange={set("title")} placeholder="Task title" required autoFocus className={inputCls} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={set("description")} placeholder="What needs to be done?" rows={3} className={`${inputCls} resize-none`} />
          </div>

          {/* Priority + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
              <select value={form.priority} onChange={set("priority")} className={inputCls}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            {editTask && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                <select value={form.status} onChange={set("status")} className={inputCls}>
                  <option value="todo">To Do</option>
                  <option value="inProgress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            )}
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Assignee</label>
            <select value={form.assignee} onChange={set("assignee")} className={inputCls}>
              <option value="">Unassigned</option>
              {members.map((m) => {
                const u = m.user as User;
                return u?._id ? (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ) : null;
              })}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
            <input type="date" value={form.dueDate} onChange={set("dueDate")} className={inputCls} />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={loading || !form.title.trim()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {editTask ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
