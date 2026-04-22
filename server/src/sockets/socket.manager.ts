import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import { verifyToken } from "../utils/jwt.utils.js";
import type { AuthTokenPayload } from "../types/index.js";

let io: Server;

export const initSocket = async (httpServer: HTTPServer): Promise<Server> => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  try {
    const { createAdapter } = await import("@socket.io/redis-adapter");
    const { redisClient } = await import("../config/redis.js");

    if (redisClient.status === "ready") {
      const subClient = redisClient.duplicate();
      await subClient.connect().catch(() => {});
      io.adapter(createAdapter(redisClient, subClient));
      console.log("Socket.IO: Redis adapter attached");
    } else {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 2000);
        redisClient.once("ready", async () => {
          clearTimeout(timeout);
          try {
            const subClient = redisClient.duplicate();
            await subClient.connect().catch(() => {});
            io.adapter(createAdapter(redisClient, subClient));
            console.log("Socket.IO: Redis adapter attached");
          } catch {
            console.warn("Socket.IO: Could not attach Redis adapter, using in-memory");
          }
          resolve();
        });
        redisClient.once("error", () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
  } catch {
    console.warn("Socket.IO: Redis adapter unavailable, using in-memory (single-instance) mode");
  }

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