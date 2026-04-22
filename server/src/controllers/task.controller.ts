import type { Request, Response, NextFunction } from "express";
import * as taskService from "../services/task.service.js";

const asyncHandler =
  (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };

export const createTask = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = req.params.projectId as string;
    const userId = req.user?.userId.toString();

    const response = await taskService.createTask({
      ...req.body,
      projectId,
      createdBy: userId!,
    });

    res.status(201).json(response);
  }
);

export const getTasks = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = req.params.projectId as string;

    const response = await taskService.getTasks(projectId);

    res.status(200).json(response);
  }
);


export const updateTask = asyncHandler(
  async (req: Request, res: Response) => {
    const taskId = req.params.taskId as string;

    const response = await taskService.updateTask(taskId, req.body);

    res.status(200).json(response);
  }
);

export const updateTaskStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const taskId = req.params.taskId as string;

    const { status } = req.body;

    const response = await taskService.updateTaskStatus(taskId, status);

    res.status(200).json(response);
  }
);

export const deleteTask = asyncHandler(
  async (req: Request, res: Response) => {
    const taskId = req.params.taskId as string;

    const response = await taskService.deleteTask(taskId);

    res.status(200).json(response);
  }
);