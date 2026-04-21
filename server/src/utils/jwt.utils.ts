import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";
import type { AuthTokenPayload } from "../types/index.ts";

// Function to generate JWT token
export const generateToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

// Function to verify JWT token
export const verifyToken = (token: string): AuthTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  // jwt.verify returns string | JwtPayload, so we ensure proper typing
  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }

  return decoded as AuthTokenPayload;
};