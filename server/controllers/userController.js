import bcrypt from "bcryptjs";
import User from "../Models/User.js";
import {
  isPasswordValid,
  getPasswordError,
} from "../utils/passwordValidation.js";

export const getMe = async (req, res, next) => {
  try {
    const safeUserId = String(req.user?.userId || "");
    const user = await User.findById(safeUserId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "ไม่พบผู้ใช้",
        data: null,
      });
    }

    res.json({
      message: "ดึงข้อมูลผู้ใช้สำเร็จ",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const safeUserId = String(req.user?.userId || "");
    const user = await User.findById(safeUserId);

    if (!user) {
      return res.status(404).json({
        message: "ไม่พบผู้ใช้",
        data: null,
      });
    }

    const {
      nickname,
      fullName,
      firstName,
      lastName,
      avatar,
      bio,
      gender,
      birthDate,
      phone,
      social,
      currentPassword,
      newPassword,
    } = req.body;

    const stringFields = { nickname, fullName, firstName, lastName, avatar, bio, phone };
    for (const [key, value] of Object.entries(stringFields)) {
      if (value !== undefined) {
        if (typeof value !== "string") {
          return res.status(400).json({
            message: `ข้อมูล ${key} ไม่ถูกต้อง`,
            data: null,
          });
        }
        user[key] = String(value).trim();
      }
    }

    if (gender !== undefined) {
      if (typeof gender !== "string") {
        return res.status(400).json({
          message: "ข้อมูลเพศไม่ถูกต้อง",
          data: null,
        });
      }
      const safeGender = String(gender).trim();
      if (!["", "male", "female", "other"].includes(safeGender)) {
        return res.status(400).json({
          message: "เพศไม่ถูกต้อง",
          data: null,
        });
      }
      user.gender = safeGender;
    }

    if (birthDate !== undefined) {
      if (birthDate === null || birthDate === "") {
        user.birthDate = null;
      } else {
        const parsedDate = new Date(birthDate);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({
            message: "รูปแบบวันเกิดไม่ถูกต้อง",
            data: null,
          });
        }
        user.birthDate = parsedDate;
      }
    }

    if (social !== undefined) {
      if (typeof social !== "object" || social === null || Array.isArray(social)) {
        return res.status(400).json({
          message: "ข้อมูลโซเชียลมีเดียไม่ถูกต้อง",
          data: null,
        });
      }

      const allowedPlatforms = ["facebook", "instagram", "youtube", "tiktok", "twitch", "x"];
      for (const [platform, url] of Object.entries(social)) {
        if (allowedPlatforms.includes(platform)) {
          if (typeof url !== "string") {
            return res.status(400).json({
              message: `ข้อมูลโซเชียล ${platform} ไม่ถูกต้อง`,
              data: null,
            });
          }
          if (!user.social) {
            user.social = {};
          }
          user.social[platform] = String(url).trim();
        }
      }
    }

    if (newPassword !== undefined || currentPassword !== undefined) {
      if (typeof newPassword !== "string" || typeof currentPassword !== "string") {
        return res.status(400).json({
          message: "ข้อมูลรหัสผ่านไม่ถูกต้อง",
          data: null,
        });
      }

      if (user.password) {
        const isMatch = await bcrypt.compare(String(currentPassword), user.password);
        if (!isMatch) {
          return res.status(400).json({
            message: "รหัสผ่านปัจจุบันไม่ถูกต้อง",
            data: null,
          });
        }
      }

      const safeNewPassword = String(newPassword);
      if (!isPasswordValid(safeNewPassword)) {
        return res.status(400).json({
          message: getPasswordError(safeNewPassword) || "รหัสผ่านใหม่ไม่ปลอดภัย",
          data: null,
        });
      }

      user.password = await bcrypt.hash(safeNewPassword, 10);
    }

    await user.save();

    const updatedUser = typeof user.toObject === "function" ? user.toObject() : { ...user };
    delete updatedUser.password;

    return res.json({
      message: "อัปเดตข้อมูลผู้ใช้สำเร็จ",
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

