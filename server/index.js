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
    socket.join(streamerId);
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

connectDB();

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
