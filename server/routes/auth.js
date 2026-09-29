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
// POST /api/auth/register
// ─────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

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

    const safeEmail = String(email);
    const safeUsername = String(username);

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

    const user = new User({ username, email, password: hashedPassword });
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
    console.error("Register error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

// ─────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
    }

    const safeEmail = String(email);
    const user = await User.findOne({ email: { $eq: safeEmail } });
    // user.password ว่างได้ ถ้าสมัครผ่าน Google (มีแค่ googleId)
    if (!user || !user.password) {

      return res.status(400).json({ message: "Email หรือรหัสผ่านไม่ถูกต้อง" });
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
