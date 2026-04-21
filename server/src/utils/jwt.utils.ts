import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.ts";
import type { AuthTokenPayload } from "../types/index.ts";

export const generateToken = (payload: AuthTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyToken = (token: string): AuthTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }

  return decoded as AuthTokenPayload;
};