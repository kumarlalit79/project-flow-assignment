import { Router } from "express";
import authRoutes from "./auth.routes.ts";
import projectRoutes from "./project.routes.ts";
import taskRoutes from "./task.routes.ts";
import userRoutes from "./user.routes.ts";

const router = Router();

router.use("/auth", authRoutes);

router.use("/projects", projectRoutes);

router.use("/projects/:projectId/tasks", taskRoutes);

router.use("/users", userRoutes);

export default router;