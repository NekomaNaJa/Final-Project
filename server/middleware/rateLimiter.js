import rateLimit from "express-rate-limit";

// Rate limiter สำหรับ public auth endpoints (login, register) ป้องกัน Brute-force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 20, // จำกัด 20 ครั้งต่อ 15 นาที ต่อ 1 IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
    data: null,
  },
  skip: () => process.env.NODE_ENV === "test",
});

// General limiter สำหรับ API ทั่วไป
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "มีการส่งคำขอมากเกินไป กรุณาลองใหม่ในภายหลัง",
    data: null,
  },
  skip: () => process.env.NODE_ENV === "test",
});
