import { TaskModel } from "../models/task.model.js";
import { ProjectModel } from "../models/project.model.js";
import { ApiResponse } from "../utils/api-response.utils.js";
import type { ITask } from "../types/index.js";
import { getIO } from "../sockets/socket.manager.js";
import { SocketEvents } from "../types/index.js";

export const createTask = async (data: {
  title: string;
  description: string;
  projectId: string;
  createdBy: string;
  priority?: ITask["priority"];
  assignee?: string;
  dueDate?: string;
  status?: ITask["status"];
}): Promise<ApiResponse<ITask>> => {
  const { title, description, projectId, createdBy, priority, assignee, dueDate, status } = data;

  const project = await ProjectModel.findById(projectId);
  if (!project) {
    throw Object.assign(new Error("Project not found"), {
      statusCode: 404,
    });
  }

  const createdTask = await TaskModel.create({
    title,
    description,
    priority,
    assignee: assignee || null,
    dueDate: dueDate || null,
    status,
    project: projectId,
    createdBy,
  });

  const task = await TaskModel.findById(createdTask._id)
    .populate("assignee", "_id name email");

  if (!task) {
    throw Object.assign(new Error("Task not found after creation"), {
      statusCode: 500,
    });
  }

  const io = getIO();
  io.to(`project:${projectId}`).emit(SocketEvents.TASK_CREATED, {
    task: task.toObject(),
  });

  return ApiResponse.success("Task created successfully", task.toObject());
};

export const getTasks = async (
  projectId: string,
): Promise<ApiResponse<ITask[]>> => {
  const tasks = await TaskModel.find({ project: projectId })
    .populate("assignee", "_id name email");

  return ApiResponse.success(
    "Tasks fetched successfully",
    tasks.map((t) => t.toObject()),
  );
};

export const updateTask = async (
  taskId: string,
  data: Partial<ITask>,
): Promise<ApiResponse<ITask>> => {
  const task = await TaskModel.findByIdAndUpdate(taskId, data, { new: true })
    .populate("assignee", "_id name email");

  if (!task) {
    throw Object.assign(new Error("Task not found"), {
      statusCode: 404,
    });
  }
  const io = getIO();
  io.to(`project:${task.project.toString()}`).emit(SocketEvents.TASK_UPDATED, {
    task: task.toObject(),
  });

  return ApiResponse.success("Task updated successfully", task.toObject());
};

export const updateTaskStatus = async (
  taskId: string,
  status: ITask["status"],
): Promise<ApiResponse<ITask>> => {
  const task = await TaskModel.findByIdAndUpdate(
    taskId,
    { status },
    { new: true },
  ).populate("assignee", "_id name email");

  if (!task) {
    throw Object.assign(new Error("Task not found"), {
      statusCode: 404,
    });
  }

  const io = getIO();
  io.to(`project:${task.project.toString()}`).emit(SocketEvents.TASK_UPDATED, {
    task: task.toObject(),
  });

  return ApiResponse.success("Task status updated", task.toObject());
};

export const deleteTask = async (
  taskId: string,
): Promise<ApiResponse<null>> => {
  const task = await TaskModel.findByIdAndDelete(taskId);

  if (!task) {
    throw Object.assign(new Error("Task not found"), {
      statusCode: 404,
    });
  }

  const io = getIO();

  io.to(`project:${task.project.toString()}`).emit(SocketEvents.TASK_DELETED, {
    taskId,
  });

  return ApiResponse.success("Task deleted successfully");
};
