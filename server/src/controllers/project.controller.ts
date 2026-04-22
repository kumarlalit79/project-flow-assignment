import type { Request, Response, NextFunction } from "express";
import * as projectService from "../services/project.service.js";

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };

export const createProject = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId.toString();

    const response = await projectService.createProject({
      ...req.body,
      userId: userId!,
    });

    res.status(201).json(response);
  },
);

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId.toString();

  const response = await projectService.getProjects(userId!);

  res.status(200).json(response);
});

export const getProjectById = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const response = await projectService.getProjectById(id);

    res.status(200).json(response);
  },
);

export const updateProject = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const response = await projectService.updateProject(id, req.body);

    res.status(200).json(response);
  },
);

export const deleteProject = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const response = await projectService.deleteProject(id);

    res.status(200).json(response);
  },
);

export const addMember = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = req.params.id as string;
    const { userId, role } = req.body as { userId: string; role?: string };

    const response = await projectService.addMember(
      projectId,
      userId,
      role as import("../types/index.ts").ProjectMemberRole | undefined,
    );

    res.status(200).json(response);
  },
);

export const removeMember = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = req.params.id as string;
    const userId = req.params.userId as string;

    const response = await projectService.removeMember(projectId, userId);

    res.status(200).json(response);
  },
);
