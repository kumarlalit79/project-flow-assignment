import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (token: string) => {
  if (socket) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL as string, {
    auth: {
      token,
    },
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};