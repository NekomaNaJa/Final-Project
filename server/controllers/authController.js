import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../Models/User.js";
import Otp from "../Models/Otp.js";
import { sendEmailOtp, sendSmsOtp } from "../services/notificationService.js";
import {
  isPasswordValid,
  getPasswordError,
} from "../utils/passwordValidation.js";
import { getJwtSecret } from "../utils/jwtSecret.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

const maskTarget = (target, type) => {
  if (type === "email") {
    const [local, domain] = target.split("@");
    if (!domain) return target;
    const maskedLocal = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : `${local[0]}***`;
    return `${maskedLocal}@${domain}`;
  }
  const cleaned = target.replace(/\D/g, "");
  if (cleaned.length >= 9) {
    return `${cleaned.slice(0, 3)}-***-${cleaned.slice(-4)}`;
  }
  return target;
};

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

    const secret = getJwtSecret();
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

    const secret = getJwtSecret();
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

const findOrCreateGoogleUser = async (googleProfile) => {
  const safeGoogleId = googleProfile.sub;
  const safeEmail = googleProfile.email;
let user = await User.findOne({
  $or: [
    { googleId: { $eq: safeGoogleId } },
    { email: { $eq: safeEmail } },
  ],
});

if (user) {
  let isUpdated = false;
  if (!user.googleId) {
    user.googleId = safeGoogleId;
    isUpdated = true;
  }
  if (!user.avatar && googleProfile.picture) {
    user.avatar = googleProfile.picture;
    isUpdated = true;
  }
  if (!user.isEmailVerified) {
    user.isEmailVerified = true;
    isUpdated = true;
  }
  if (isUpdated) {
    await user.save();
  }
} else {
  let baseUsername = safeEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
  if (baseUsername.length < 3) {
    baseUsername = `user_${safeGoogleId.slice(-6)}`;
  }
  baseUsername = baseUsername.slice(0, 20);

  let candidateUsername = baseUsername;
  let counter = 1;
  while (await User.findOne({ username: { $eq: candidateUsername } })) {
    candidateUsername = `${baseUsername.slice(0, 15)}_${counter}`;
    counter++;
  }

  user = new User({
    username: candidateUsername,
    email: safeEmail,
    googleId: safeGoogleId,
    fullName: googleProfile.name || "",
    nickname: googleProfile.name ? googleProfile.name.split(" ")[0] : candidateUsername,
    avatar: googleProfile.picture || "",
    isEmailVerified: true,
    password: null,
  });
  await user.save();
}

  return user;
};

export const googleAuth = async (req, res, next) => {
  try {
    const { credential, accessToken, mockUser } = req.body;

    let googleProfile = null;

    if (process.env.NODE_ENV === "test" && mockUser && typeof mockUser === "object") {
      googleProfile = {
        sub: String(mockUser.sub || mockUser.googleId || "mock_google_id"),
        email: String(mockUser.email || "mock@gmail.com").trim().toLowerCase(),
        name: String(mockUser.name || "Mock User"),
        picture: String(mockUser.picture || ""),
      };
    } else if (typeof credential === "string" && credential.trim()) {
      const safeCredential = String(credential).trim();
      const googleRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(safeCredential)}`
      );
      const data = await googleRes.json();
      if (!googleRes.ok || !data.sub || !data.email) {
        return res.status(400).json({
          message: "Google Token ไม่ถูกต้องหรือหมดอายุ",
          data: null,
        });
      }
      googleProfile = {
        sub: String(data.sub),
        email: String(data.email).trim().toLowerCase(),
        name: String(data.name || data.given_name || ""),
        picture: String(data.picture || ""),
      };
    } else if (typeof accessToken === "string" && accessToken.trim()) {
      const safeAccessToken = String(accessToken).trim();
      const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${safeAccessToken}` },
      });
      const data = await googleRes.json();
      if (!googleRes.ok || !data.sub || !data.email) {
        return res.status(400).json({
          message: "Google Access Token ไม่ถูกต้องหรือหมดอายุ",
          data: null,
        });
      }
      googleProfile = {
        sub: String(data.sub),
        email: String(data.email).trim().toLowerCase(),
        name: String(data.name || data.given_name || ""),
        picture: String(data.picture || ""),
      };
    } else {
      return res.status(400).json({
        message: "กรุณาระบุ Google Credential หรือ Token ที่ถูกต้อง",
        data: null,
      });
    }

    const user = await findOrCreateGoogleUser(googleProfile);

    const secret = getJwtSecret();
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      secret,
      { expiresIn: "7d" }
    );

    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
    };

    res.json({
      message: "เข้าสู่ระบบด้วย Google สำเร็จ",
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

const verifyOtpMatch = async (plainOtp, otpRecord) => {
  const stored = otpRecord?.otpCode || otpRecord?.otp || "";
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$")) {
    return bcrypt.compare(plainOtp, stored);
  }
  return stored === plainOtp;
};

export const requestOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string") {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
        data: null,
      });
    }

    const safeEmail = String(email).trim().toLowerCase();

    if (!EMAIL_REGEX.test(safeEmail)) {
      return res.status(400).json({
        message: "รูปแบบอีเมลไม่ถูกต้อง",
        data: null,
      });
    }

    const user = await User.findOne({ email: { $eq: safeEmail } });
    if (!user) {
      return res.status(404).json({
        message: "ไม่พบบัญชีผู้ใช้ในระบบ",
        data: null,
      });
    }

    const otpCode = String(crypto.randomInt(100000, 1000000));
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ email: { $eq: safeEmail } });

    await Otp.create({
      email: safeEmail,
      otpCode: hashedOtp,
      target: safeEmail,
      type: "email",
      purpose: "verify_email",
      otp: hashedOtp,
      expiresAt,
    });

    try {
      await sendEmailOtp(safeEmail, otpCode, "verify_email");
    } catch (deliveryError) {
      await Otp.deleteMany({ email: { $eq: safeEmail } });
      return res.status(503).json({
        message:
          deliveryError.message === "EMAIL_NOT_CONFIGURED"
            ? "ระบบส่งอีเมลยังไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลระบบ"
            : "ไม่สามารถส่งอีเมล OTP ได้ กรุณาลองใหม่อีกครั้ง",
        data: null,
      });
    }

    const masked = maskTarget(safeEmail, "email");

    return res.status(200).json({
      message: `ส่งรหัส OTP ไปยัง ${masked} เรียบร้อยแล้ว`,
      data: {
        email: safeEmail,
        maskedEmail: masked,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otpCode, otp } = req.body;
    const rawOtp = otpCode !== undefined ? otpCode : otp;

    if (typeof email !== "string" || typeof rawOtp !== "string") {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
        data: null,
      });
    }

    const safeEmail = String(email).trim().toLowerCase();
    const safeOtpCode = String(rawOtp).trim();

    if (!EMAIL_REGEX.test(safeEmail) || !/^\d{6}$/.test(safeOtpCode)) {
      return res.status(400).json({
        message: "ข้อมูลอีเมลหรือรหัส OTP ไม่ถูกต้อง",
        data: null,
      });
    }

    const otpRecord = await Otp.findOne({
      email: { $eq: safeEmail },
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "รหัส OTP หมดอายุหรือไม่มีอยู่ในระบบ กรุณาขอรหัสใหม่",
        data: null,
      });
    }

    if (otpRecord.expiresAt && otpRecord.expiresAt < new Date()) {
      await Otp.deleteMany({ email: { $eq: safeEmail } });
      return res.status(400).json({
        message: "รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่",
        data: null,
      });
    }

    if (otpRecord.attempts >= 5) {
      await Otp.deleteMany({ email: { $eq: safeEmail } });
      return res.status(400).json({
        message: "คุณกรอกรหัสผิดเกินจำนวนครั้งที่กำหนด กรุณาขอรหัสใหม่",
        data: null,
      });
    }

    const isMatched = await verifyOtpMatch(safeOtpCode, otpRecord);
    if (!isMatched) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      if (typeof otpRecord.save === "function") {
        await otpRecord.save();
      }
      return res.status(400).json({
        message: "รหัส OTP ไม่ถูกต้อง",
        data: null,
      });
    }

    await User.updateOne(
      { email: { $eq: safeEmail } },
      { isEmailVerified: true }
    );
    await Otp.deleteMany({ email: { $eq: safeEmail } });

    return res.status(200).json({
      message: "ยืนยันอีเมลสำเร็จ",
      data: {
        email: safeEmail,
        isEmailVerified: true,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPasswordSendOtp = async (req, res, next) => {
  try {
    const { identifier, channel } = req.body;

    if (typeof identifier !== "string" || typeof channel !== "string") {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
        data: null,
      });
    }

    const safeIdentifier = String(identifier).trim();
    const safeChannel = String(channel).trim().toLowerCase();

    if (!["email", "sms"].includes(safeChannel)) {
      return res.status(400).json({
        message: "ช่องทางการส่งรหัสไม่ถูกต้อง (ต้องเป็น email หรือ sms)",
        data: null,
      });
    }

    const cleanPhone = safeIdentifier.replace(/\D/g, "");

    const user = await User.findOne({
      $or: [
        { email: { $eq: safeIdentifier.toLowerCase() } },
        { phone: { $eq: cleanPhone } },
        { username: { $eq: safeIdentifier } },
      ],
    });

    if (!user) {
      return res.status(404).json({
        message: "ไม่พบบัญชีผู้ใช้ในระบบ",
        data: null,
      });
    }

    let target = "";
    if (safeChannel === "email") {
      if (!user.email) {
        return res.status(400).json({
          message: "บัญชีนี้ไม่มีอีเมลที่ลงทะเบียนไว้",
          data: null,
        });
      }
      target = user.email;
    } else {
      if (!user.phone) {
        return res.status(400).json({
          message: "บัญชีนี้ยังไม่ได้เชื่อมต่อเบอร์โทรศัพท์ กรุณาเลือกยืนยันผ่านอีเมล",
          data: null,
        });
      }
      target = user.phone;
    }

    const otpCode = String(crypto.randomInt(100000, 1000000));
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({
      target: { $eq: target },
      purpose: { $eq: "forgot_password" },
    });

    await Otp.create({
      email: safeChannel === "email" ? target.toLowerCase() : "",
      otpCode: hashedOtp,
      target,
      type: safeChannel === "email" ? "email" : "phone",
      purpose: "forgot_password",
      otp: hashedOtp,
      expiresAt,
    });

    if (safeChannel === "email") {
      try {
        await sendEmailOtp(target, otpCode, "forgot_password");
      } catch (deliveryError) {
        await Otp.deleteMany({ target: { $eq: target }, purpose: { $eq: "forgot_password" } });
        return res.status(503).json({
          message: deliveryError.message === "EMAIL_NOT_CONFIGURED"
            ? "ระบบส่งอีเมลยังไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลระบบ"
            : "ไม่สามารถส่งอีเมล OTP ได้ กรุณาลองใหม่อีกครั้ง",
          data: null,
        });
      }
    } else {
      await sendSmsOtp(target, otpCode, "forgot_password");
    }

    const masked = maskTarget(target, safeChannel === "email" ? "email" : "phone");

    res.json({
      message: `ส่งรหัส OTP ไปยัง ${masked} เรียบร้อยแล้ว`,
      data: {
        channel: safeChannel,
        maskedTarget: masked,
        target,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPasswordVerifyOtp = async (req, res, next) => {
  try {
    const { target, otp } = req.body;

    if (typeof target !== "string" || typeof otp !== "string") {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
        data: null,
      });
    }

    const safeTarget = String(target).trim();
    const safeOtp = String(otp).trim();

    const otpRecord = await Otp.findOne({
      target: { $eq: safeTarget },
      purpose: { $eq: "forgot_password" },
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "รหัส OTP หมดอายุหรือไม่มีอยู่ในระบบ กรุณาขอรหัสใหม่",
        data: null,
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        message: "รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่",
        data: null,
      });
    }

    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        message: "คุณกรอกรหัสผิดเกินจำนวนครั้งที่กำหนด กรุณาขอรหัสใหม่",
        data: null,
      });
    }

    const isMatched = await verifyOtpMatch(safeOtp, otpRecord);
    if (!isMatched) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        message: "รหัส OTP ไม่ถูกต้อง",
        data: null,
      });
    }

    const cleanPhone = safeTarget.replace(/\D/g, "");
    const user = await User.findOne({
      $or: [
        { email: { $eq: safeTarget.toLowerCase() } },
        { phone: { $eq: cleanPhone } },
      ],
    });

    if (!user) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลผู้ใช้สำหรับรหัส OTP นี้",
        data: null,
      });
    }

    await Otp.deleteOne({ _id: otpRecord._id });

    const secret = getJwtSecret();
    const resetToken = jwt.sign(
      { userId: user._id, purpose: "password_reset" },
      secret,
      { expiresIn: "15m" }
    );

    res.json({
      message: "ยืนยันรหัส OTP สำเร็จ",
      data: {
        resetToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPasswordReset = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (typeof resetToken !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
        data: null,
      });
    }

    const secret = getJwtSecret();
    let decoded;
    try {
      decoded = jwt.verify(resetToken, secret);
    } catch {
      return res.status(400).json({
        message: "โทเค็นการรีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว กรุณาทำรายการใหม่",
        data: null,
      });
    }

    if (decoded.purpose !== "password_reset" || !decoded.userId) {
      return res.status(400).json({
        message: "โทเค็นไม่ถูกต้อง",
        data: null,
      });
    }

    if (!isPasswordValid(newPassword)) {
      return res.status(400).json({
        message: getPasswordError(newPassword),
        data: null,
      });
    }

    const safeUserId = String(decoded.userId);
    const user = await User.findById(safeUserId);
    if (!user) {
      return res.status(404).json({
        message: "ไม่พบบัญชีผู้ใช้",
        data: null,
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      message: "ตั้งรหัสผ่านใหม่สำเร็จแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};


