import http from "http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./sockets/socket.manager.js";
import { registerSocketHandlers } from "./sockets/socket.handlers.js";
import dns from "dns"
import { config } from "dotenv";
config();


dns.setServers(["1.1.1.1", "8.8.8.8"])

const server = http.createServer(app);

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const io = await initSocket(server);
    io.on("connection", (socket) => {
      registerSocketHandlers(io, socket);
    });

    server.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
};

startServer();