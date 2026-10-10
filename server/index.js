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
      const rooms = [cleanTarget];
      if (!cleanTarget.startsWith("streamer_")) {
        rooms.push(`streamer_${cleanTarget}`);
      }
      io.to(rooms).emit("donation-alert", payload);
    }
  });

  socket.on("widget-config-update", (data) => {
    const targets = new Set(
      [data?.token, data?.streamerId, data?.username].filter(
        (t) => typeof t === "string" && t.trim()
      )
    );

    const rooms = new Set();
    for (const target of targets) {
      const cleanTarget = String(target).trim();
      rooms.add(cleanTarget);
      if (!cleanTarget.startsWith("streamer_")) {
        rooms.add(`streamer_${cleanTarget}`);
      }
    }

    if (rooms.size > 0) {
      io.to(Array.from(rooms)).emit("widget-config-updated", data);
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
