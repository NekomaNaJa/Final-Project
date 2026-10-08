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

    const { promptpay, bank, truemoney } = req.body;

    if (!user.payment) {
      user.payment = {
        promptpay: { enabled: false, type: null, number: "" },
        bank: { enabled: false, bankName: null, accountNumber: "", accountName: "" },
        truemoney: { enabled: false, phone: "" },
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

    // 3. Validate & update TrueMoney
    if (truemoney !== undefined) {
      if (typeof truemoney !== "object" || truemoney === null || Array.isArray(truemoney)) {
        return res.status(400).json({
          message: "ข้อมูลทรูมันนี่ไม่ถูกต้อง",
          data: null,
        });
      }

      if (truemoney.enabled !== undefined) {
        user.payment.truemoney.enabled = Boolean(truemoney.enabled);
      }

      if (truemoney.phone !== undefined) {
        if (typeof truemoney.phone !== "string") {
          return res.status(400).json({
            message: "เบอร์โทรศัพท์ทรูมันนี่ต้องเป็นข้อความ",
            data: null,
          });
        }
        user.payment.truemoney.phone = String(truemoney.phone).trim();
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


    await user.save();

    return res.json({
      message: "อัปเดตการตั้งค่าหน้ารับเงินสำเร็จ",
      data: user.donationPage,
    });
  } catch (err) {
    next(err);
  }
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

    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({
        message: "ข้อมูลรหัสผ่านไม่ถูกต้อง",
        data: null,
      });
    }

    if (user.password) {
      const isMatch = await bcrypt.compare(
        String(currentPassword),
        user.password
      );
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


