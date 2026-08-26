import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();
connectDB();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, methods: ["GET", "POST"] },
});

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

// Socket.io — แนบ io ไว้ใน request เพื่อใช้ใน controller
app.use((req, _, next) => {
  req.io = io;
  next();
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);
  socket.on("join-stream", (streamerId) => socket.join(streamerId));
  socket.on("disconnect", () => console.log("❌ Disconnected:", socket.id));
});

httpServer.listen(process.env.PORT, () =>
  console.log(`🚀 Server running on port ${process.env.PORT}`),
);
