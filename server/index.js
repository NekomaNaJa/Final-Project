import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// โหลด .env จากโฟลเดอร์ server/ เสมอ ไม่ว่าจะรันคำสั่งจากที่ไหน
dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = process.env.PORT || 5000;

// ตัด trailing slash ออก เพราะ cors เทียบ origin แบบ exact string
// ("http://localhost:3000/" !== "http://localhost:3000" ทำให้ถูกบล็อก CORS)
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);

if (!process.env.JWT_SECRET) {
  console.error(
    "❌ ไม่พบ JWT_SECRET ในไฟล์ .env กรุณาตั้งค่าก่อนเริ่มเซิร์ฟเวอร์",
  );
  process.exit(1);
}

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: CLIENT_URL,
  })
);

app.use(express.json());

app.use((req, _, next) => {
  req.io = io;
  next();
});

app.use("/api/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "ไม่พบเส้นทางที่เรียก" });
});

// Error handler ตัวสุดท้าย: กันไม่ให้ stack trace หรือข้อความภายในหลุดไปถึง client
app.use((err, _req, res, _next) => {
  if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ message: "รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง" });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("join-stream", (streamerId) => {
    if (typeof streamerId !== "string" || streamerId.length === 0) {
      return;
    }
    socket.join(streamerId);
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

await connectDB();

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
