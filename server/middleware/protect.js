import jwt from "jsonwebtoken";
import { getJwtSecret } from "../utils/jwtSecret.js";

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ",
      data: null,
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      message: "Token ไม่ถูกต้องหรือหมดอายุ",
      data: null,
    });
  }
};

export default protect;
