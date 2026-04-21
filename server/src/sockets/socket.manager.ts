import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisClient } from "../config/redis.ts";
import { verifyToken } from "../utils/jwt.utils.ts";
import type { AuthTokenPayload } from "../types/index.ts";

let io: Server;

export const initSocket = (httpServer: HTTPServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"],
    },
  });

  
  const pubClient = redisClient;
  const subClient = redisClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Unauthorized: No token"));
      }

      const decoded = verifyToken(token) as AuthTokenPayload;

      
      socket.data.user = decoded;

      next();
    } catch {
      next(new Error("Unauthorized: Invalid token"));
    }
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};