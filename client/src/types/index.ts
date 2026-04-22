// ─── Enums (mirrored from server) ──────────────────────────────────────────

export type UserRole = "admin" | "member";
export type ProjectMemberRole = "manager" | "member";
export type TaskStatus = "todo" | "inProgress" | "done";
export type TaskPriority = "low" | "medium" | "high";

// ─── Entities ──────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  user: string | User;
  role: ProjectMemberRole;
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  createdBy: string;
  members: ProjectMember[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  project: string;
  assignee: string | User | null;
  createdBy: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── API Shape ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
}
