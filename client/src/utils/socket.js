import socketIOClient, { io as namedIo } from "socket.io-client";
import { API_URL } from "./api";

const io = typeof namedIo === "function" ? namedIo : socketIOClient;

/**
 * Socket.IO Server Base URL (ตัด /api ท้ายสตริงออกเพื่อให้เชื่อมต่อไปยัง Socket Server ได้ถูกต้อง)
 */
export const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  (API_URL ? API_URL.replace(/\/api\/?$/, "") : "http://localhost:5000");

let socketInstance = null;

const activeRooms = new Set();

/**
 * รับ instance ของ Socket.IO client (Singleton pattern)
 */
export const getSocket = (options = {}) => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      ...options,
    });

    socketInstance.on("connect", () => {
      activeRooms.forEach((room) => {
        socketInstance.emit("join-stream", room);
      });
    });
  }
  return socketInstance;
};

/**
 * ตัดการเชื่อมต่อและคืนค่า Socket.IO client
 */
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
  activeRooms.clear();
};

/**
 * เข้าร่วมห้องสตรีมเมอร์เพื่อรับอีเวนต์เรียลไทม์ (OBS Overlay & Streamer Dashboard)
 */
export const joinStreamRoom = (room) => {
  if (!room) return;
  const s = getSocket();
  const cleanRoom = String(room).trim();
  activeRooms.add(cleanRoom);
  s.emit("join-stream", cleanRoom);
  if (!cleanRoom.startsWith("streamer_")) {
    activeRooms.add(`streamer_${cleanRoom}`);
    s.emit("join-stream", `streamer_${cleanRoom}`);
  }
};

/**
 * ออกจากห้องสตรีมเมอร์
 */
export const leaveStreamRoom = (room) => {
  if (!room) return;
  const s = getSocket();
  const cleanRoom = String(room).trim();
  activeRooms.delete(cleanRoom);
  activeRooms.delete(`streamer_${cleanRoom}`);
  s.emit("leave-stream", cleanRoom);
  if (!cleanRoom.startsWith("streamer_")) {
    s.emit("leave-stream", `streamer_${cleanRoom}`);
  }
};

/**
 * ส่งคำขอทดสอบแจ้งเตือน (Test Alert) แบบเรียลไทม์
 */
export const emitTestAlert = (payload = {}) => {
  const s = getSocket();
  s.emit("test-alert", payload);
};

/**
 * ส่งการอัปเดตการตั้งค่าวิดเจ็ตแบบเรียลไทม์ไปยัง OBS Studio Browser Source
 */
export const emitWidgetConfigUpdate = (payload = {}) => {
  const s = getSocket();
  s.emit("widget-config-update", payload);
};
