export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, _next) => {
  console.error("Server Error:", err);

  // Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    const isTransRef = Boolean(err.keyPattern?.transRef);
    return res.status(400).json({
      message: isTransRef
        ? "สลิปนี้ถูกใช้งานไปแล้วในระบบ ไม่สามารถใช้ซ้ำได้"
        : "ข้อมูลนี้ถูกใช้งานแล้วในระบบ",
      data: null,
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "ข้อมูลที่ส่งมาไม่ถูกต้องตามเงื่อนไข",
      data: null,
    });
  }

  // Mongoose invalid ObjectId (CastError)
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "รูปแบบข้อมูลระบุตัวตนไม่ถูกต้อง",
      data: null,
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode === 500 && !err.isOperational
      ? "เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่"
      : err.message || "เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่";

  res.status(statusCode).json({
    message,
    data: null,
  });
};

export default errorHandler;
