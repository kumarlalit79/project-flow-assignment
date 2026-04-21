import { Router } from "express";
import * as userController from "../controllers/user.controller.ts";
import { protect, authorize } from "../middleware/auth.middleware.ts";
import { validate } from "../middleware/validate.middleware.ts";
import { z } from "zod";
import { UserRole } from "../types/index.ts";

const router = Router();

const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.nativeEnum(UserRole), 
  }),
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  query: z.object({}),
});


router.get(
  "/",
  protect,
  authorize(UserRole.ADMIN),
  userController.getAllUsers
);

router.patch(
  "/:id/role",
  protect,
  authorize(UserRole.ADMIN),
  validate(updateUserRoleSchema),
  userController.updateUserRole
);

export default router;