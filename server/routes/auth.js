import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../Models/User.js";
import {
  isPasswordValid,
  getPasswordError,
} from "../utils/passwordValidation.js";

const router = express.Router();

// ─────────────────────────────────────
// Middleware: ตรวจ JWT จาก Authorization: Bearer <token>
// ─────────────────────────────────────
const verifyToken = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || typeof token !== "string" || token.length === 0) {
    return res.status(401).json({ message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" });
  }

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" });
  }
};

// ─────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────
router.get("/me", verifyToken, async (req, res) => {
  try {
    // userId มาจาก JWT ที่ผ่านการ verify แล้ว ไม่ใช่ค่าจาก request
    const user = await User.findById(req.auth.userId);
    if (!user) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        bio: user.bio,
        joinedAt: user.createdAt,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

// ─────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
    }

    if (!isPasswordValid(password)) {
      return res.status(400).json({ message: getPasswordError(password) });
    }

    // ตัดสาย taint ด้วย String() และแปลงเป็นตัวพิมพ์เล็กให้ตรงกับ schema
    const safeEmail = String(email).trim().toLowerCase();
    const safeUsername = String(username).trim();

    const existingEmail = await User.findOne({ email: { $eq: safeEmail } });
    if (existingEmail) {
      return res.status(400).json({ message: "Email นี้ถูกใช้งานแล้ว" });
    }

    const existingUsername = await User.findOne({
      username: { $eq: safeUsername },
    });
    if (existingUsername) {
      return res.status(400).json({ message: "Username นี้ถูกใช้งานแล้ว" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username: safeUsername,
      email: safeEmail,
      password: hashedPassword,
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ",
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    // จับกรณี race condition ที่สองคนสมัครอีเมลเดียวกันพร้อมกัน
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Email หรือ Username ถูกใช้งานแล้ว" });
    }
    console.error("Register error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

// ─────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
    }

    // รองรับทั้งการล็อกอินด้วยอีเมลและชื่อผู้ใช้
    // ตัดสาย taint ด้วย String() แล้วครอบด้วย $eq ตามรูปแบบ NoSQL Injection
    const identifier = String(email).trim();
    const safeEmail = identifier.toLowerCase();

    // password ถูกตั้ง select: false ไว้ใน schema ต้องขอกลับมาอย่างชัดเจน
    const user =
      (await User.findOne({ email: { $eq: safeEmail } }).select("+password")) ||
      (await User.findOne({ username: { $eq: identifier } }).select("+password"));

    // user.password ว่างได้ ถ้าสมัครผ่าน Google (มีแค่ googleId)
    if (!user || !user.password) {
      return res
        .status(400)
        .json({ message: "Email หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

export default router;
