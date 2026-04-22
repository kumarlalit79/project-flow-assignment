import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };

export const register = asyncHandler(async (req: Request, res: Response) => {
  console.log("Register hit with body:", req.body);
  const response = await authService.registerUser(req.body);

  res.status(201).json(response);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const response = await authService.loginUser(req.body);

  res.status(200).json(response);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId.toString();

  const response = await authService.getMe(userId!);

  res.status(200).json(response);
});
