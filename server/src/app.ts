import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";

export const app = express();

app.use(
  cors({
    origin: "*", 
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("API is running");
});

app.use("/api", routes);

app.use(errorHandler);