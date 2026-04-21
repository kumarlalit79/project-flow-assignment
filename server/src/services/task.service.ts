import { TaskModel } from "../models/task.model.ts";
import { ProjectModel } from "../models/project.model.ts";
import { ApiResponse } from "../utils/api-response.utils.ts";
import type { ITask } from "../types/index.ts";
import { getIO } from "../sockets/socket.manager.ts";
import { SocketEvents } from "../types/index.ts";

export const createTask = async (data: {
  title: string;
  description: string;
  projectId: string;
  createdBy: string;
}): Promise<ApiResponse<ITask>> => {
  const { title, description, projectId, createdBy } = data;

  const project = await ProjectModel.findById(projectId);
  if (!project) {
    throw Object.assign(new Error("Project not found"), {
      statusCode: 404,
    });
  }

  const task = await TaskModel.create({
    title,
    description,
    project: projectId,
    createdBy,
  });
  const io = getIO();
  io.to(`project:${projectId}`).emit(SocketEvents.TASK_CREATED, {
    task: task.toObject(),
  });

  return ApiResponse.success("Task created successfully", task.toObject());
};

export const getTasks = async (
  projectId: string,
): Promise<ApiResponse<ITask[]>> => {
  const tasks = await TaskModel.find({ project: projectId });

  return ApiResponse.success(
    "Tasks fetched successfully",
    tasks.map((t) => t.toObject()),
  );
};

export const updateTask = async (
  taskId: string,
  data: Partial<ITask>,
): Promise<ApiResponse<ITask>> => {
  const task = await TaskModel.findByIdAndUpdate(taskId, data, {
    new: true,
  });

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
  );

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
