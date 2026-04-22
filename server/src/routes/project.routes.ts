import { Router } from "express";
import * as projectController from "../controllers/project.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { z } from "zod";
import { UserRole } from "../types/index.js";

const router = Router();


const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
  }),
  params: z.object({}),
  query: z.object({}),
});

const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Project ID is required"),
  }),
  query: z.object({}),
});


router.post(
  "/",
  protect,
  authorize(UserRole.ADMIN),
  validate(createProjectSchema),
  projectController.createProject
);

router.get("/", protect, projectController.getProjects);

router.get(
  "/:id",
  protect,
  projectController.getProjectById
);

router.patch(
  "/:id",
  protect,
  authorize(UserRole.ADMIN),
  validate(updateProjectSchema),
  projectController.updateProject
);

router.delete(
  "/:id",
  protect,
  authorize(UserRole.ADMIN),
  projectController.deleteProject
);

// ─── Member Management ──────────────────────────────────────────────────────

const addMemberSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "User ID is required"),
    role: z.enum(["manager", "member"]).optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Project ID is required"),
  }),
  query: z.object({}),
});

const removeMemberSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: z.string().min(1, "Project ID is required"),
    userId: z.string().min(1, "User ID is required"),
  }),
  query: z.object({}),
});

// Admin or project Manager can add members
router.post(
  "/:id/members",
  protect,
  validate(addMemberSchema),
  projectController.addMember,
);

// Admin or project Manager can remove members
router.delete(
  "/:id/members/:userId",
  protect,
  validate(removeMemberSchema),
  projectController.removeMember,
);

export default router;