// ต้องเป็น import แรกสุด เพื่อให้ .env ถูกโหลดก่อนที่ app.js จะอ่าน process.env
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import app, { CLIENT_URL } from "./app.js";

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("join-stream", (streamerId) => {
    if (typeof streamerId === "string" && streamerId.trim()) {
      const cleanId = String(streamerId).trim();
      socket.join(cleanId);
      if (!cleanId.startsWith("streamer_")) {
        socket.join(`streamer_${cleanId}`);
      }
    }
  });

  socket.on("leave-stream", (streamerId) => {
    if (typeof streamerId === "string" && streamerId.trim()) {
      const cleanId = String(streamerId).trim();
      socket.leave(cleanId);
      if (!cleanId.startsWith("streamer_")) {
        socket.leave(`streamer_${cleanId}`);
      }
    }
  });

  socket.on("test-alert", (data) => {
    const target = data?.streamerId || data?.username;
    if (typeof target === "string" && target.trim()) {
      const cleanTarget = String(target).trim();
      const payload = {
        donorName: data.donorName || "ผู้สนับสนุนใจดี (ทดสอบ)",
        amount: Number(data.amount) || 100,
        message: data.message || "นี่คือข้อความทดสอบระบบแจ้งเตือน Donix Alert",
        isTest: true,
      };
      io.to(cleanTarget).emit("donation-alert", payload);
      if (!cleanTarget.startsWith("streamer_")) {
        io.to(`streamer_${cleanTarget}`).emit("donation-alert", payload);
      }
    }
  });

  socket.on("widget-config-update", (data) => {
    const target = data?.token || data?.streamerId;
    if (typeof target === "string" && target.trim()) {
      const cleanTarget = String(target).trim();
      io.to(cleanTarget).emit("widget-config-updated", data);
      if (!cleanTarget.startsWith("streamer_")) {
        io.to(`streamer_${cleanTarget}`).emit("widget-config-updated", data);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

connectDB();

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
