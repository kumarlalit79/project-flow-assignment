import http from "http";
import { app } from "./app.ts";
import { env } from "./config/env.ts";
import { connectDB } from "./config/db.ts";
import { initSocket } from "./sockets/socket.manager.ts";
import { registerSocketHandlers } from "./sockets/socket.handlers.ts";
import dns from "dns"

dns.setServers(["1.1.1.1", "8.8.8.8"])

const server = http.createServer(app);

const io = initSocket(server);

io.on("connection", (socket) => {
  registerSocketHandlers(io, socket);
});

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    server.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
};

startServer();