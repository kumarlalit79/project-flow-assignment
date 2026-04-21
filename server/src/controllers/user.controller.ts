import type { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service.ts";
import { UserRole } from "../types/index.ts";

const asyncHandler =
  (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };

export const getAllUsers = asyncHandler(
  async (_req: Request, res: Response) => {
    const response = await userService.getAllUsers();

    res.status(200).json(response);
  }
);

export const updateUserRole = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.id as string;
    const { role } = req.body as { role: UserRole };

    const response = await userService.updateUserRole(userId, role);

    res.status(200).json(response);
  }
);