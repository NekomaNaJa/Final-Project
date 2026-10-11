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

    const secret = process.env.JWT_SECRET || "donix_jwt_secret_dev";
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
