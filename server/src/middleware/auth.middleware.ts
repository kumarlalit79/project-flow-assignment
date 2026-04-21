import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.utils.ts";
import { ApiResponse } from "../utils/api-response.utils.ts";
import { UserRole } from "../types/index.ts";

export const protect = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json(ApiResponse.error("Unauthorized: No token provided"));
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    if (!token) {
      res.status(401).json(ApiResponse.error("Unauthorized: Token missing"));
      return;
    }

    const decoded = verifyToken(token);

    req.user = {
      userId: decoded.userId as any,
      role: decoded.role,
    };

    next();
  } catch {
    res.status(401).json(ApiResponse.error("Unauthorized: Invalid token"));
  }
};

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json(ApiResponse.error("Forbidden: Access denied"));
      return;
    }

    next();
  };
