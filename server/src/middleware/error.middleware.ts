import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/api-response.utils.ts";

interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // DEBUG: print full error to server terminal
  console.error("❌ Error caught by errorHandler:", err);

  const statusCode = err.statusCode || 500;

  const message =
    statusCode === 500
      ? process.env.NODE_ENV === "development" ? err.message : "Internal Server Error"
      : err.message || "Something went wrong";

  res.status(statusCode).json(
    ApiResponse.error(message, {
      stack:
        process.env.NODE_ENV === "development"
          ? err.stack
          : undefined,
    })
  );
};