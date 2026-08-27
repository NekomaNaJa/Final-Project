import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

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