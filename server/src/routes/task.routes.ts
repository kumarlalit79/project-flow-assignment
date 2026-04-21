import { Router } from "express";
import * as taskController from "../controllers/task.controller.ts";
import { protect } from "../middleware/auth.middleware.ts";
import { validate } from "../middleware/validate.middleware.ts";
import { z } from "zod";

const router = Router({ mergeParams: true }); 


const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
  }),
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
  }),
  query: z.object({}),
});

const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    assignee: z.string().optional(),
    dueDate: z.string().optional(),
  }),
  params: z.object({
    projectId: z.string(),
    taskId: z.string(),
  }),
  query: z.object({}),
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(["todo", "inProgress", "done"]),
  }),
  params: z.object({
    projectId: z.string(),
    taskId: z.string(),
  }),
  query: z.object({}),
});


router.post(
  "/",
  protect,
  validate(createTaskSchema),
  taskController.createTask
);

router.get(
  "/",
  protect,
  validate(
    z.object({
      body: z.object({}),
      params: z.object({
        projectId: z.string(),
      }),
      query: z.object({}),
    })
  ),
  taskController.getTasks
);

router.patch(
  "/:taskId",
  protect,
  validate(updateTaskSchema),
  taskController.updateTask
);

router.patch(
  "/:taskId/status",
  protect,
  validate(updateStatusSchema),
  taskController.updateTaskStatus
);

router.delete(
  "/:taskId",
  protect,
  validate(
    z.object({
      body: z.object({}),
      params: z.object({
        projectId: z.string(),
        taskId: z.string(),
      }),
      query: z.object({}),
    })
  ),
  taskController.deleteTask
);

export default router;