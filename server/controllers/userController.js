import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import User from "../Models/User.js";
import Otp from "../Models/Otp.js";
import { sendEmailOtp, sendSmsOtp } from "../services/notificationService.js";
import {
  isPasswordValid,
  getPasswordError,
} from "../utils/passwordValidation.js";

// Bounded, linear-time email shape validation without regex backtracking.
const EMAIL_REGEX = { test(value) {
  if (typeof value !== "string" || value.length > 254 || /\s/.test(value)) return false;
  const at = value.indexOf("@");
  if (at < 1 || at !== value.lastIndexOf("@")) return false;
  const domain = value.slice(at + 1);
  const dot = domain.lastIndexOf(".");
  return dot > 0 && dot < domain.length - 1;
} };
const PHONE_REGEX = /^0\d{9}$/;

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
      isLive,
      currentPassword,
      newPassword,
    } = req.body;

    if (isLive !== undefined) {
      if (typeof isLive !== "boolean") {
        return res.status(400).json({
          message: "ข้อมูลสถานะเปิดรับเงินไม่ถูกต้อง",
          data: null,
        });
      }
      user.isLive = Boolean(isLive);
    }

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

export const updatePayment = async (req, res, next) => {
  try {
    const safeUserId = String(req.user?.userId || "");
    const user = await User.findById(safeUserId);

    if (!user) {
      return res.status(404).json({
        message: "ไม่พบผู้ใช้",
        data: null,
      });
    }

    const { promptpay, bank } = req.body;

    if (!user.payment) {
      user.payment = {
        promptpay: { enabled: false, type: null, number: "" },
        bank: { enabled: false, bankName: null, accountNumber: "", accountName: "" },
      };
    }

    // 1. Validate & update PromptPay
    if (promptpay !== undefined) {
      if (typeof promptpay !== "object" || promptpay === null || Array.isArray(promptpay)) {
        return res.status(400).json({
          message: "ข้อมูลพร้อมเพย์ไม่ถูกต้อง",
          data: null,
        });
      }

      const allowedTypes = [
        null,
        "เบอร์โทรศัพท์",
        "เลขบัตรประจำตัวประชาชน",
        "e-Wallet ID",
        "K-Shop",
        "SCB แม่มณี",
        "BBL Merchant Pro",
        "ร้านค้าถุงเงิน",
      ];

      if (promptpay.type !== undefined) {
        if (promptpay.type !== null && !allowedTypes.includes(promptpay.type)) {
          return res.status(400).json({
            message: "ประเภทพร้อมเพย์ไม่ถูกต้อง",
            data: null,
          });
        }
        user.payment.promptpay.type = promptpay.type;
      }

      if (promptpay.enabled !== undefined) {
        user.payment.promptpay.enabled = Boolean(promptpay.enabled);
      }

      if (promptpay.number !== undefined) {
        if (typeof promptpay.number !== "string") {
          return res.status(400).json({
            message: "หมายเลขพร้อมเพย์ต้องเป็นข้อความ",
            data: null,
          });
        }
        user.payment.promptpay.number = String(promptpay.number).trim();
      }
    }

    // 2. Validate & update Bank
    if (bank !== undefined) {
      if (typeof bank !== "object" || bank === null || Array.isArray(bank)) {
        return res.status(400).json({
          message: "ข้อมูลธนาคารไม่ถูกต้อง",
          data: null,
        });
      }

      const allowedBanks = [
        null,
        "",
        "ธนาคารไทยพาณิชย์ (SCB)",
        "ธนาคารกสิกรไทย(KBANK)",
        "ธนาคารกรุงไทย (KTB)",
        "ธนาคารกรุงเทพ (BBL)",
        "ธนาคารกรุงศรี (BAY)",
        "ธนาคารทหารไทยธนชาต (TTB)",
        "ธนาคารออมสิน (GSB)",
      ];

      if (bank.bankName !== undefined) {
        if (bank.bankName !== null && !allowedBanks.includes(bank.bankName)) {
          return res.status(400).json({
            message: "ชื่อธนาคารไม่ถูกต้อง",
            data: null,
          });
        }
        user.payment.bank.bankName = bank.bankName || null;
      }

      if (bank.enabled !== undefined) {
        user.payment.bank.enabled = Boolean(bank.enabled);
      }

      if (bank.accountNumber !== undefined) {
        if (typeof bank.accountNumber !== "string") {
          return res.status(400).json({
            message: "เลขบัญชีธนาคารต้องเป็นข้อความ",
            data: null,
          });
        }
        user.payment.bank.accountNumber = String(bank.accountNumber).trim();
      }

      if (bank.accountName !== undefined) {
        if (typeof bank.accountName !== "string") {
          return res.status(400).json({
            message: "ชื่อบัญชีธนาคารต้องเป็นข้อความ",
            data: null,
          });
        }
        user.payment.bank.accountName = String(bank.accountName).trim();
      }
    }

    await user.save();

    return res.json({
      message: "อัปเดตช่องทางรับเงินสำเร็จ",
      data: user.payment,
    });
  } catch (err) {
    next(err);
  }
};

export const updateDonationPage = async (req, res, next) => {
  try {
    const rawUserId = req.user?.userId;
    if (typeof rawUserId !== "string" && typeof rawUserId !== "number") {
      return res.status(400).json({
        message: "ข้อมูลผู้ใช้ไม่ถูกต้อง",
        data: null,
      });
    }

    const safeUserId = String(rawUserId);
    const user = await User.findOne({ _id: { $eq: safeUserId } });

    if (!user) {
      return res.status(404).json({
        message: "ไม่พบผู้ใช้",
        data: null,
      });
    }

    if (!user.donationPage) {
      user.donationPage = {};
    }

    const data =
      typeof req.body.donationPage === "object" &&
      req.body.donationPage !== null &&
      !Array.isArray(req.body.donationPage)
        ? req.body.donationPage
        : req.body;

    const {
      welcomeMessage,
      thankYouMessage,
      minAmount,
      charLimit,
      disableFilter,
      filteredWords,
      coverImage,
      backgroundImage,
      autoApproveSlip,
    } = data;

    if (welcomeMessage !== undefined) {
      if (typeof welcomeMessage !== "string") {
        return res.status(400).json({
          message: "ข้อความต้อนรับไม่ถูกต้อง",
          data: null,
        });
      }
      user.donationPage.welcomeMessage = String(welcomeMessage).trim();
    }

    if (thankYouMessage !== undefined) {
      if (typeof thankYouMessage !== "string") {
        return res.status(400).json({
          message: "ข้อความขอบคุณไม่ถูกต้อง",
          data: null,
        });
      }
      user.donationPage.thankYouMessage = String(thankYouMessage).trim();
    }

    if (minAmount !== undefined) {
      const parsedMin = Number(minAmount);
      if (isNaN(parsedMin) || parsedMin < 0) {
        return res.status(400).json({
          message: "จำนวนเงินขั้นต่ำไม่ถูกต้อง",
          data: null,
        });
      }
      user.donationPage.minAmount = parsedMin;
    }

    if (charLimit !== undefined) {
      let parsedCharLimit;
      if (charLimit === "unlimited") {
        parsedCharLimit = 0;
      } else {
        parsedCharLimit = Number(charLimit);
        if (isNaN(parsedCharLimit) || parsedCharLimit < 0) {
          return res.status(400).json({
            message: "จำนวนจำกัดตัวอักษรไม่ถูกต้อง",
            data: null,
          });
        }
      }
      user.donationPage.charLimit = parsedCharLimit;
    }

    if (disableFilter !== undefined) {
      if (typeof disableFilter !== "boolean") {
        return res.status(400).json({
          message: "ค่าตัวกรองข้อความไม่ถูกต้อง",
          data: null,
        });
      }
      user.donationPage.disableFilter = Boolean(disableFilter);
    }

    if (filteredWords !== undefined) {
      if (!Array.isArray(filteredWords)) {
        return res.status(400).json({
          message: "รายการคำที่กรองไม่ถูกต้อง",
          data: null,
        });
      }
      for (const word of filteredWords) {
        if (typeof word !== "string") {
          return res.status(400).json({
            message: "คำที่กรองต้องเป็นข้อความ",
            data: null,
          });
        }
      }
      user.donationPage.filteredWords = filteredWords
        .map((w) => String(w).trim())
        .filter(Boolean);
    }

    if (coverImage !== undefined) {
      if (coverImage !== null && typeof coverImage !== "string") {
        return res.status(400).json({
          message: "รูปภาพหน้าปกไม่ถูกต้อง",
          data: null,
        });
      }
      user.donationPage.coverImage = coverImage ? String(coverImage).trim() : null;
    }

    if (backgroundImage !== undefined) {
      if (backgroundImage !== null && typeof backgroundImage !== "string") {
        return res.status(400).json({
          message: "รูปภาพพื้นหลังไม่ถูกต้อง",
          data: null,
        });
      }
      user.donationPage.backgroundImage = backgroundImage
        ? String(backgroundImage).trim()
        : null;
    }

    if (autoApproveSlip !== undefined) {
      user.donationPage.autoApproveSlip = Boolean(autoApproveSlip);
    }

    await user.save();

    return res.json({
      message: "อัปเดตการตั้งค่าหน้ารับเงินสำเร็จ",
      data: user.donationPage,
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

const verifyOtpForPasswordChange = async (user, rawOtp) => {
  if (typeof rawOtp !== "string" || !/^\d{6}$/.test(rawOtp.trim())) {
    return "รหัส OTP ไม่ถูกต้อง";
  }
  const safeOtp = String(rawOtp).trim();
  const safeEmail = String(user.email || "").trim().toLowerCase();
  const otpRecord = await Otp.findOne({
    $or: [
      { email: { $eq: safeEmail } },
      { target: { $eq: safeEmail } },
    ],
  });

  if (!otpRecord || (otpRecord.expiresAt && otpRecord.expiresAt < new Date())) {
    return "รหัส OTP หมดอายุหรือไม่มีอยู่ในระบบ กรุณาขอรหัสใหม่";
  }

  const isOtpValid = await verifyOtpMatch(safeOtp, otpRecord);
  if (!isOtpValid) {
    return "รหัส OTP ไม่ถูกต้อง";
  }

  await Otp.deleteOne({ _id: otpRecord._id });
  return null;
};

const verifyCurrentPasswordForChange = async (user, currentPassword) => {
  if (typeof currentPassword !== "string") {
    return "ข้อมูลรหัสผ่านไม่ถูกต้อง";
  }
  if (!user.password) {
    return null;
  }
  const isMatch = await bcrypt.compare(String(currentPassword), user.password);
  return isMatch ? null : "รหัสผ่านปัจจุบันไม่ถูกต้อง";
};

export const changePassword = async (req, res, next) => {
  try {
    const safeUserId = String(req.user?.userId || "");
    const user = await User.findById(safeUserId);

    if (!user) {
      return res.status(404).json({
        message: "ไม่พบผู้ใช้",
        data: null,
      });
    }

    const { currentPassword, newPassword, otp, otpCode } = req.body;
    const rawOtp = otpCode !== undefined ? otpCode : otp;

    if (typeof newPassword !== "string") {
      return res.status(400).json({
        message: "ข้อมูลรหัสผ่านไม่ถูกต้อง",
        data: null,
      });
    }

    const authError =
      rawOtp !== undefined
        ? await verifyOtpForPasswordChange(user, rawOtp)
        : await verifyCurrentPasswordForChange(user, currentPassword);

    if (authError) {
      return res.status(400).json({
        message: authError,
        data: null,
      });
    }

    const safeNewPassword = String(newPassword);
    if (!isPasswordValid(safeNewPassword)) {
      return res.status(400).json({
        message:
          getPasswordError(safeNewPassword) || "รหัสผ่านใหม่ไม่ปลอดภัย",
        data: null,
      });
    }

    user.password = await bcrypt.hash(safeNewPassword, 10);
    await user.save();

    return res.json({
      message: "เปลี่ยนรหัสผ่านสำเร็จ",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const sendLinkOtp = async (req, res, next) => {
  try {
    const safeUserId = String(req.user?.userId || "");
    const user = await User.findById(safeUserId);
    if (!user) {
      return res.status(404).json({
        message: "ไม่พบผู้ใช้",
        data: null,
      });
    }

    const { target, type } = req.body;
    if (typeof target !== "string" || typeof type !== "string") {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
        data: null,
      });
    }

    const safeTarget = String(target).trim();
    const safeType = String(type).trim().toLowerCase();

    if (!["email", "phone"].includes(safeType)) {
      return res.status(400).json({
        message: "ประเภทข้อมูลไม่ถูกต้อง (ต้องเป็น email หรือ phone)",
        data: null,
      });
    }

    if (safeType === "email") {
      if (!EMAIL_REGEX.test(safeTarget)) {
        return res.status(400).json({
          message: "รูปแบบอีเมลไม่ถูกต้อง",
          data: null,
        });
      }

      const existing = await User.findOne({
        email: { $eq: safeTarget.toLowerCase() },
        _id: { $ne: user._id },
      });
      if (existing) {
        return res.status(400).json({
          message: "อีเมลนี้ถูกใช้งานโดยบัญชีอื่นแล้ว",
          data: null,
        });
      }
    } else {
      const cleanPhone = safeTarget.replace(/\D/g, "");
      if (!PHONE_REGEX.test(cleanPhone)) {
        return res.status(400).json({
          message: "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นตัวเลข 10 หลักขึ้นต้นด้วย 0)",
          data: null,
        });
      }

      const existing = await User.findOne({
        phone: { $eq: cleanPhone },
        _id: { $ne: user._id },
      });
      if (existing) {
        return res.status(400).json({
          message: "เบอร์โทรศัพท์นี้ถูกใช้งานโดยบัญชีอื่นแล้ว",
          data: null,
        });
      }
    }

    const purpose = safeType === "email" ? "verify_email" : "verify_phone";
    const otpCode = String(crypto.randomInt(100000, 1000000));
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({
      target: { $eq: safeTarget },
      purpose: { $eq: purpose },
    });

    await Otp.create({
      email: safeType === "email" ? safeTarget.toLowerCase() : "",
      otpCode: hashedOtp,
      target: safeTarget,
      type: safeType,
      purpose,
      otp: hashedOtp,
      expiresAt,
    });

    let deliveryResult;
    if (safeType === "email") {
      try {
        deliveryResult = await sendEmailOtp(safeTarget, otpCode, purpose);
      } catch (deliveryError) {
        await Otp.deleteMany({ target: { $eq: safeTarget }, purpose: { $eq: purpose } });
        const notConfigured = deliveryError.message === "EMAIL_NOT_CONFIGURED";
        return res.status(503).json({
          message: notConfigured
            ? "ระบบส่งอีเมลยังไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลระบบ"
            : "ไม่สามารถส่งอีเมล OTP ได้ กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ",
          data: null,
        });
      }
    } else {
      deliveryResult = await sendSmsOtp(safeTarget, otpCode, purpose);
    }

    const responseData = {
      target: safeTarget,
      type: safeType,
    };
    const isDummyEmail = /@(test|example)\.(com|org|net)$/i.test(safeTarget);
    if ((deliveryResult?.simulated || isDummyEmail) && process.env.NODE_ENV !== "test") {
      responseData.simulated = Boolean(deliveryResult?.simulated);
      responseData.demoOtp = otpCode;
    }

    res.json({
      message: `ส่งรหัส OTP ไปยัง ${safeTarget} เรียบร้อยแล้ว`,
      data: responseData,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyLinkOtp = async (req, res, next) => {
  try {
    const safeUserId = String(req.user?.userId || "");
    const user = await User.findById(safeUserId);
    if (!user) {
      return res.status(404).json({
        message: "ไม่พบผู้ใช้",
        data: null,
      });
    }

    const { target, type, otp } = req.body;
    if (typeof target !== "string" || typeof type !== "string" || typeof otp !== "string") {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
        data: null,
      });
    }

    const safeTarget = String(target).trim();
    const safeType = String(type).trim().toLowerCase();
    const safeOtp = String(otp).trim();

    const purpose = safeType === "email" ? "verify_email" : "verify_phone";

    const otpRecord = await Otp.findOne({
      target: { $eq: safeTarget },
      purpose: { $eq: purpose },
      type: { $eq: safeType },
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

    await Otp.deleteOne({ _id: otpRecord._id });

    if (safeType === "email") {
      user.email = safeTarget.toLowerCase();
      user.isEmailVerified = true;
    } else {
      user.phone = safeTarget.replace(/\D/g, "");
      user.isPhoneVerified = true;
    }

    await user.save();

    const updatedUser = await User.findById(safeUserId).select("-password");

    res.json({
      message: safeType === "email" ? "เชื่อมต่อและยืนยันอีเมลสำเร็จ" : "เชื่อมต่อและยืนยันเบอร์โทรศัพท์สำเร็จ",
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

const ALLOWED_SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
  "twitch",
  "x",
];

const OAUTH_CONFIGS = {
  youtube: {
    providerName: "Google / YouTube",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    defaultClientId: "donix-youtube-oauth.apps.googleusercontent.com",
    authBaseUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: "https://www.googleapis.com/auth/youtube.readonly email profile",
    extraAuthParams: "&access_type=offline&prompt=consent",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userUrl: "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    fallbackUserUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    formatUrl: (h) => `https://youtube.com/@${h}`,
    extractHandle: (userData, altData) => {
      const item = userData?.items?.[0];
      if (item?.snippet?.customUrl) {
        return item.snippet.customUrl.replace(/^@+/, "");
      }
      if (item?.snippet?.title) {
        return item.snippet.title.replace(/\s+/g, "_");
      }
      if (altData?.name) {
        return altData.name.replace(/\s+/g, "_");
      }
      if (altData?.email) {
        return altData.email.split("@")[0];
      }
      return "youtube_channel";
    },
  },
  twitch: {
    providerName: "Twitch",
    clientIdEnv: "TWITCH_CLIENT_ID",
    clientSecretEnv: "TWITCH_CLIENT_SECRET",
    defaultClientId: "donix-twitch-client-id",
    authBaseUrl: "https://id.twitch.tv/oauth2/authorize",
    scopes: "user:read:email",
    extraAuthParams: "&force_verify=true",
    tokenUrl: "https://id.twitch.tv/oauth2/token",
    userUrl: "https://api.twitch.tv/helix/users",
    formatUrl: (h) => `https://twitch.tv/${h}`,
    extractHandle: (userData) => {
      const u = userData?.data?.[0];
      return u?.login || u?.display_name || "twitch_streamer";
    },
  },
  facebook: {
    providerName: "Facebook",
    clientIdEnv: "FACEBOOK_CLIENT_ID",
    clientSecretEnv: "FACEBOOK_CLIENT_SECRET",
    defaultClientId: "donix-facebook-app-id",
    authBaseUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    scopes: "public_profile,email",
    extraAuthParams: "",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    userUrl: "https://graph.facebook.com/me?fields=id,name,short_name",
    formatUrl: (h) => `https://facebook.com/${h}`,
    extractHandle: (userData) => {
      return userData?.short_name || userData?.name?.replace(/\s+/g, "_") || userData?.id || "facebook_user";
    },
  },
  instagram: {
    providerName: "Instagram",
    clientIdEnv: "INSTAGRAM_CLIENT_ID",
    clientSecretEnv: "INSTAGRAM_CLIENT_SECRET",
    defaultClientId: "donix-instagram-app-id",
    authBaseUrl: "https://api.instagram.com/oauth/authorize",
    scopes: "user_profile,user_media",
    extraAuthParams: "",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    userUrl: "https://graph.instagram.com/me?fields=id,username",
    formatUrl: (h) => `https://instagram.com/${h}`,
    extractHandle: (userData) => {
      return userData?.username || "instagram_user";
    },
  },
  tiktok: {
    providerName: "TikTok",
    clientIdEnv: "TIKTOK_CLIENT_KEY",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
    defaultClientId: "donix-tiktok-client-key",
    authBaseUrl: "https://www.tiktok.com/v2/auth/authorize/",
    scopes: "user.info.basic",
    extraAuthParams: "",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    userUrl: "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username",
    formatUrl: (h) => `https://tiktok.com/@${h}`,
    extractHandle: (userData) => {
      return userData?.data?.user?.username || userData?.data?.user?.display_name?.replace(/\s+/g, "_") || "tiktok_creator";
    },
  },
  x: {
    providerName: "X (Twitter)",
    clientIdEnv: "X_CLIENT_ID",
    clientSecretEnv: "X_CLIENT_SECRET",
    defaultClientId: "donix-x-client-id",
    authBaseUrl: "https://twitter.com/i/oauth2/authorize",
    scopes: "tweet.read users.read",
    extraAuthParams: "&code_challenge=challenge&code_challenge_method=plain",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    userUrl: "https://api.twitter.com/2/users/me",
    formatUrl: (h) => `https://x.com/${h}`,
    extractHandle: (userData) => {
      return userData?.data?.username || "x_user";
    },
  },
};

export const getSocialAuthUrl = async (req, res, next) => {
  try {
    const { platform } = req.params;
    if (typeof platform !== "string") {
      return res.status(400).json({
        message: "ข้อมูลแพลตฟอร์มไม่ถูกต้อง",
        data: null,
      });
    }

    const safePlatform = String(platform).trim().toLowerCase();
    if (!ALLOWED_SOCIAL_PLATFORMS.includes(safePlatform)) {
      return res.status(400).json({
        message: `ไม่รองรับแพลตฟอร์ม ${safePlatform}`,
        data: null,
      });
    }

    const { redirectUri, state } = req.query;
    const safeRedirectUri =
      typeof redirectUri === "string" && redirectUri.trim()
        ? String(redirectUri).trim()
        : `${process.env.CLIENT_URL || "http://localhost:3000"}/oauth-callback`;

    const safeState =
      typeof state === "string" && state.trim()
        ? String(state).trim()
        : `${safePlatform}_${crypto.randomBytes(8).toString("hex")}`;

    const config = OAUTH_CONFIGS[safePlatform];
    const clientId =
      process.env[config.clientIdEnv] ||
      (safePlatform === "youtube" ? process.env.REACT_APP_GOOGLE_CLIENT_ID : "") ||
      config.defaultClientId;

    const authUrl = `${config.authBaseUrl}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(safeRedirectUri)}&response_type=code&scope=${encodeURIComponent(config.scopes)}&state=${encodeURIComponent(safeState)}${config.extraAuthParams || ""}`;

    res.json({
      message: `สร้างลิงก์ยืนยันตัวตนของ ${config.providerName} สำเร็จ`,
      data: {
        platform: safePlatform,
        authUrl,
        redirectUri: safeRedirectUri,
        state: safeState,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const connectSocialAccount = async (req, res, next) => {
  try {
    const { platform } = req.params;
    if (typeof platform !== "string") {
      return res.status(400).json({
        message: "ข้อมูลแพลตฟอร์มไม่ถูกต้อง",
        data: null,
      });
    }

    const safePlatform = String(platform).trim().toLowerCase();
    if (!ALLOWED_SOCIAL_PLATFORMS.includes(safePlatform)) {
      return res.status(400).json({
        message: `ไม่รองรับแพลตฟอร์ม ${safePlatform}`,
        data: null,
      });
    }

    const safeUserId = String(req.user?.userId || "");
    const user = await User.findById(safeUserId);
    if (!user) {
      return res.status(404).json({
        message: "ไม่พบผู้ใช้",
        data: null,
      });
    }

    const { code, redirectUri, handle, accessToken, mockProfile } = req.body;
    let extractedHandle = "";
    const config = OAUTH_CONFIGS[safePlatform];

    // Check test environment mock profile
    if (process.env.NODE_ENV === "test" && mockProfile && typeof mockProfile === "object") {
      extractedHandle = String(mockProfile.handle || mockProfile.username || "test_user").trim();
    } else if (typeof code === "string" && code.trim()) {
      const safeCode = String(code).trim();
      const safeRedirectUri =
        typeof redirectUri === "string" && redirectUri.trim()
          ? String(redirectUri).trim()
          : `${process.env.CLIENT_URL || "http://localhost:3000"}/oauth-callback`;

      const clientId =
        process.env[config.clientIdEnv] ||
        (safePlatform === "youtube" ? process.env.REACT_APP_GOOGLE_CLIENT_ID : "") ||
        config.defaultClientId;
      const clientSecret = process.env[config.clientSecretEnv] || "dummy_secret";

      let token = accessToken && typeof accessToken === "string" ? String(accessToken).trim() : null;

      if (!token) {
        try {
          const bodyParams = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code: safeCode,
            grant_type: "authorization_code",
            redirect_uri: safeRedirectUri,
          });

          if (safePlatform === "tiktok") {
            bodyParams.set("client_key", clientId);
          }
          if (safePlatform === "x") {
            bodyParams.set("code_verifier", "challenge");
          }

          const tokenRes = await fetch(config.tokenUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
            },
            body: bodyParams.toString(),
          });

          const tokenData = await tokenRes.json();
          if (tokenRes.ok && tokenData.access_token) {
            token = tokenData.access_token;
          }
        } catch (fetchErr) {
          console.error(`[OAuth Token Exchange Error - ${safePlatform}]:`, fetchErr.message);
        }
      }

      if (token) {
        try {
          const headers = {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          };
          if (safePlatform === "twitch") {
            headers["Client-Id"] = clientId;
          }

          const userRes = await fetch(config.userUrl, { headers });
          const userData = await userRes.json();

          let altData = null;
          if (safePlatform === "youtube" && (!userData?.items || userData.items.length === 0)) {
            const altRes = await fetch(config.fallbackUserUrl, { headers });
            altData = await altRes.json();
          }

          extractedHandle = config.extractHandle(userData, altData);
        } catch (userFetchErr) {
          console.error(`[OAuth Profile Fetch Error - ${safePlatform}]:`, userFetchErr.message);
        }
      }

      if (!extractedHandle && typeof handle === "string" && handle.trim()) {
        extractedHandle = String(handle).trim();
      }
    } else if (typeof handle === "string" && handle.trim()) {
      extractedHandle = String(handle).trim();
    } else if (typeof accessToken === "string" && accessToken.trim()) {
      const clientId = process.env[config.clientIdEnv] || config.defaultClientId;
      const headers = {
        Authorization: `Bearer ${String(accessToken).trim()}`,
        Accept: "application/json",
      };
      if (safePlatform === "twitch") {
        headers["Client-Id"] = clientId;
      }
      try {
        const userRes = await fetch(config.userUrl, { headers });
        const userData = await userRes.json();
        extractedHandle = config.extractHandle(userData, null);
      } catch (err) {
        console.error(`[OAuth AccessToken Error - ${safePlatform}]:`, err.message);
      }
    }

    if (!extractedHandle) {
      return res.status(400).json({
        message: `ไม่สามารถดึงข้อมูลบัญชี ${config.providerName} ได้ กรุณาลองใหม่อีกครั้ง`,
        data: null,
      });
    }

    const cleanedHandle = extractedHandle.replace(/^@+/, "").replace(/\s+/g, "_");
    const profileUrl = config.formatUrl(cleanedHandle);

    if (!user.social) {
      user.social = {};
    }
    user.social[safePlatform] = profileUrl;
    await user.save();

    res.json({
      message: `เชื่อมต่อบัญชี ${config.providerName} สำเร็จ`,
      data: {
        platform: safePlatform,
        handle: `@${cleanedHandle}`,
        url: profileUrl,
        social: user.social,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const disconnectSocialAccount = async (req, res, next) => {
  try {
    const { platform } = req.params;
    if (typeof platform !== "string") {
      return res.status(400).json({
        message: "ข้อมูลแพลตฟอร์มไม่ถูกต้อง",
        data: null,
      });
    }

    const safePlatform = String(platform).trim().toLowerCase();
    if (!ALLOWED_SOCIAL_PLATFORMS.includes(safePlatform)) {
      return res.status(400).json({
        message: `ไม่รองรับแพลตฟอร์ม ${safePlatform}`,
        data: null,
      });
    }

    const safeUserId = String(req.user?.userId || "");
    const user = await User.findById(safeUserId);
    if (!user) {
      return res.status(404).json({
        message: "ไม่พบผู้ใช้",
        data: null,
      });
    }

    if (!user.social) {
      user.social = {};
    }
    user.social[safePlatform] = "";
    await user.save();

    res.json({
      message: `ยกเลิกการเชื่อมต่อ ${safePlatform} สำเร็จ`,
      data: {
        platform: safePlatform,
        social: user.social,
      },
    });
  } catch (err) {
    next(err);
  }
};



