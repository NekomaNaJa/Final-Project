import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import errorHandler from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

app.use(helmet());
app.use(
  cors({
    origin: CLIENT_URL,
  }),
);
app.use(express.json());

// Forward Socket.IO instance to req.io if available
app.use((req, _, next) => {
  if (app.get("io")) {
    req.io = app.get("io");
  }
  next();
});

// General rate limiter for /api routes
app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Central error handler
app.use(errorHandler);

export default app;
