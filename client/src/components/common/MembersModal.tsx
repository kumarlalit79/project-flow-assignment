import { useState } from "react";
import { X, Loader2, UserPlus, Trash2, Crown, Shield, User as UserIcon } from "lucide-react";
import { api } from "../../lib/axios";
import { toast } from "sonner";
import type { Project, ProjectMember, User } from "../../types";

interface MembersModalProps {
  open: boolean;
  onClose: () => void;
  project: Project;
  currentUserId: string;
  isManagerOrAbove: boolean;
  onMembersUpdated: (project: Project) => void;
  allUsers: User[];
}

const roleIcon = (role: string) => {
  if (role === "manager") return <Crown className="h-3.5 w-3.5 text-amber-500" />;
  return <Shield className="h-3.5 w-3.5 text-slate-400" />;
};

const roleBadge = (role: string) => {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium";
  if (role === "manager") return `${base} bg-amber-50 text-amber-700`;
  return `${base} bg-slate-100 text-slate-600`;
};

const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const MembersModal = ({
  open,
  onClose,
  project,
  currentUserId,
  isManagerOrAbove,
  onMembersUpdated,
  allUsers,
}: MembersModalProps) => {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"manager" | "member">("member");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  if (!open) return null;

  const members = project.members ?? [];

  // Users not already in the project
  const memberIds = new Set(
    members.map((m) => (typeof m.user === "string" ? m.user : (m.user as User)._id))
  );
  const availableUsers = allUsers.filter((u) => !memberIds.has(u._id));

  const handleAdd = async () => {
    if (!selectedUserId) { toast.error("Select a user to add"); return; }
    try {
      setAdding(true);
      const res = await api.post(`/projects/${project._id}/members`, {
        userId: selectedUserId,
        role: selectedRole,
      });
      onMembersUpdated(res.data.data);
      setSelectedUserId("");
      toast.success("Member added!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to add member";
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      setRemovingId(userId);
      const res = await api.delete(`/projects/${project._id}/members/${userId}`);
      onMembersUpdated(res.data.data);
      toast.success("Member removed");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to remove member";
      toast.error(msg);
    } finally {
      setRemovingId(null);
    }
  };

  const inputCls = "border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-scale-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Project Members</h2>
            <p className="text-xs text-slate-500 mt-0.5">{members.length} member{members.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Member list */}
          <div className="space-y-2">
            {members.map((m: ProjectMember) => {
              const u = m.user as User;
              const uid = u?._id ?? (m.user as string);
              const uName = u?.name ?? "Unknown";
              const uEmail = u?.email ?? "";
              const isSelf = uid === currentUserId;

              return (
                <div key={uid} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {initials(uName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {uName} {isSelf && <span className="text-xs text-slate-400">(you)</span>}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{uEmail}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={roleBadge(m.role)}>
                      {roleIcon(m.role)}
                      {m.role}
                    </span>
                    {isManagerOrAbove && !isSelf && (
                      <button
                        onClick={() => handleRemove(uid)}
                        disabled={removingId === uid}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      >
                        {removingId === uid
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add member section */}
          {isManagerOrAbove && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-blue-600" />
                Add Member
              </p>
              <div className="space-y-3">
                {availableUsers.length > 0 ? (
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className={`w-full ${inputCls}`}
                  >
                    <option value="">Select a user…</option>
                    {availableUsers.map((u) => (
                      <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                    <UserIcon className="h-4 w-4" />
                    All users are already members
                  </div>
                )}

                <div className="flex gap-2">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as "manager" | "member")}
                    className={`flex-1 ${inputCls}`}
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                  </select>
                  <button
                    onClick={handleAdd}
                    disabled={adding || !selectedUserId}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembersModal;
