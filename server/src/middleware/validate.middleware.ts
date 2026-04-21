import type { Request, Response, NextFunction } from "express";
import { ZodObject, type ZodRawShape } from "zod";
import { ApiResponse } from "../utils/api-response.utils";

export const validate =
  (schema: ZodObject<ZodRawShape>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      res
        .status(400)
        .json(ApiResponse.error("Validation failed", result.error.flatten()));
      return;
    }

    req.body = result.data.body as typeof req.body;
    req.params = result.data.params as typeof req.params;
    req.query = result.data.query as typeof req.query;
    
    next();
  };
