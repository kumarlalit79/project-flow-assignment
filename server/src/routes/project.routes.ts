import { Router } from "express";
import * as projectController from "../controllers/project.controller.ts";
import { protect, authorize } from "../middleware/auth.middleware.ts";
import { validate } from "../middleware/validate.middleware.ts";
import { z } from "zod";
import { UserRole } from "../types/index.ts";

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

export default router;