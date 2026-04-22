import type { Types } from "mongoose";

export enum UserRole {
  ADMIN = "admin",
  MEMBER = "member",
}

export enum ProjectMemberRole {
  MANAGER = "manager",
  MEMBER = "member",
}

export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "inProgress",
  DONE = "done",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectMember {
  user: Types.ObjectId;
  role: ProjectMemberRole;
}

export interface IProject {
  _id: Types.ObjectId;
  name: string;
  description: string;
  createdBy: Types.ObjectId;
  members: IProjectMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask {
  _id: Types.ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  project: Types.ObjectId;
  assignee: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum SocketEvents {
  JOIN_PROJECT = "join:project",
  LEAVE_PROJECT = "leave:project",
  TASK_CREATED = "task:created",
  TASK_UPDATED = "task:updated",
  TASK_DELETED = "task:deleted",
  MEMBER_ADDED = "member:added",
  PROJECT_DELETED = "project:deleted",
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}
