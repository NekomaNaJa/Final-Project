import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import donationRoutes from "./routes/donations.js";
import errorHandler from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

const app = express();

// CORS เทียบ origin แบบตรงตัว จึงตัด "/" ท้าย URL ออกกันพิมพ์พลาด
const rawClientUrl = process.env.CLIENT_URL || "http://localhost:3000";
export const CLIENT_URL = rawClientUrl.endsWith("/")
  ? rawClientUrl.slice(0, -1)
  : rawClientUrl;

// Render อยู่หลัง proxy 1 ชั้น ต้องตั้งก่อน rate limiter
// ไม่งั้นผู้ใช้ทุกคนจะถูกนับเป็น IP เดียวกัน
app.set("trust proxy", 1);

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
app.use("/api/donations", donationRoutes);

// Central error handler
app.use(errorHandler);

export default app;
