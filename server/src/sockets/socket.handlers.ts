import type { Server, Socket } from "socket.io";
import { SocketEvents } from "../types/index.js";

export const registerSocketHandlers = (io: Server, socket: Socket): void => {
  const user = socket.data.user;

  socket.join(`user:${user.userId}`);

  socket.on(SocketEvents.JOIN_PROJECT, ({ projectId }) => {
    socket.join(`project:${projectId}`);
  });

  socket.on(SocketEvents.LEAVE_PROJECT, ({ projectId }) => {
    socket.leave(`project:${projectId}`);
  });

  console.log(`User connected: ${user.userId}`);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${user.userId}`);
  });
};
