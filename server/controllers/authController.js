import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../Models/User.js";
import {
  isPasswordValid,
  getPasswordError,
} from "../utils/passwordValidation.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
        data: null,
      });
    }

    const safeUsername = String(username).trim();
    const safeEmail = String(email).trim().toLowerCase();

    if (!USERNAME_REGEX.test(safeUsername)) {
      return res.status(400).json({
        message:
          "Username ต้องมีความยาว 3-30 ตัวอักษร และประกอบด้วยตัวอักษรภาษาอังกฤษ ตัวเลข หรือขีดล่างเท่านั้น",
        data: null,
      });
    }

    if (!EMAIL_REGEX.test(safeEmail)) {
      return res.status(400).json({
        message: "รูปแบบอีเมลไม่ถูกต้อง",
        data: null,
      });
    }

    if (!isPasswordValid(password)) {
      return res.status(400).json({
        message: getPasswordError(password),
        data: null,
      });
    }

    const existingEmail = await User.findOne({ email: { $eq: safeEmail } });
    if (existingEmail) {
      return res.status(400).json({
        message: "Email นี้ถูกใช้งานแล้ว",
        data: null,
      });
    }

    const existingUsername = await User.findOne({
      username: { $eq: safeUsername },
    });
    if (existingUsername) {
      return res.status(400).json({
        message: "Username นี้ถูกใช้งานแล้ว",
        data: null,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username: safeUsername,
      email: safeEmail,
      password: hashedPassword,
    });
    await user.save();

    const secret = process.env.JWT_SECRET || "donix_jwt_secret_dev";
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      secret,
      { expiresIn: "7d" },
    );

    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
    };

    res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ",
      token,
      user: userData,
      data: {
        token,
        user: userData,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
        data: null,
      });
    }

    const safeIdentifier = String(email).trim();
    const safeEmail = safeIdentifier.toLowerCase();

    const user = await User.findOne({
      $or: [
        { email: { $eq: safeEmail } },
        { username: { $eq: safeIdentifier } },
      ],
    });

    if (!user || !user.password) {
      return res.status(400).json({
        message: "Email หรือรหัสผ่านไม่ถูกต้อง",
        data: null,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Email หรือรหัสผ่านไม่ถูกต้อง",
        data: null,
      });
    }

    const secret = process.env.JWT_SECRET || "donix_jwt_secret_dev";
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      secret,
      { expiresIn: "7d" },
    );

    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
    };

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: userData,
      data: {
        token,
        user: userData,
      },
    });
  } catch (err) {
    next(err);
  }
};
