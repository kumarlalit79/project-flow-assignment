import type { Request, Response, NextFunction } from "express";
import { ZodObject, type ZodRawShape } from "zod";
import { ApiResponse } from "../utils/api-response.utils.ts";

export const validate =
  (schema: ZodObject<ZodRawShape>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body ?? {},
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
    // req.params and req.query are readonly in Express — they're already
    // correctly parsed by the router. Zod validated their shape above.
    
    next();
  };
