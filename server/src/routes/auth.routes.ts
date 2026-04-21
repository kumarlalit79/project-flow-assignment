import { Router } from "express";
import * as authController from "../controllers/auth.controller.ts";
import { protect } from "../middleware/auth.middleware.ts";
import { validate } from "../middleware/validate.middleware.ts";
import { z } from "zod";

const router = Router();

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
  params: z.object({}),
  query: z.object({}),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
  }),
  params: z.object({}),
  query: z.object({}),
});

router.post(
  "/register",
  validate(registerSchema),
  authController.register
);

router.post(
  "/login",
  validate(loginSchema),
  authController.login
);

router.get("/me", protect, authController.getMe);

export default router;