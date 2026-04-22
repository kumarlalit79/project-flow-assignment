import type { Types } from "mongoose";
import type { UserRole } from "./index.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: Types.ObjectId;
        role: UserRole;
      };
    }
  }
}