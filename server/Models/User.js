import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // select: false ป้องกันไม่ให้ hash ถูก query ออกมาโดยไม่ตั้งใจ
    // (route ที่ต้องเทียบรหัสผ่านต้องใช้ .select("+password"))
    // ส่วน toJSON transform ด้านล่างกันไม่ให้ hash หลุดตอนส่ง user ทั้ง object
    password: { type: String, default: null, select: false },

    googleId: { type: String, default: null },

    nickname: { type: String, default: "" },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    birthDate: { type: Date, default: null },
    phone: { type: String, default: "" },
    gender: { type: String, default: "" },
    bio: { type: String, default: "" },
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },

    social: {
      youtube: { type: String, default: "" },
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      tiktok: { type: String, default: "" },
      twitch: { type: String, default: "" },
      x: { type: String, default: "" },
    },

    payment: {
      promptpay: {
        enabled: { type: Boolean, default: false },
        type: {
          type: String,
          enum: [
            null,
            "เบอร์โทรศัพท์",
            "เลขบัตรประจำตัวประชาชน",
            "e-Wallet ID",
            "K-Shop",
            "SCB แม่มณี",
            "BBL Merchant Pro",
            "ร้านค้าถุงเงิน",
          ],
          default: null,
        },
        number: { type: String, default: "" },
      },
      bank: {
        enabled: { type: Boolean, default: false },
        bankName: {
          type: String,
          enum: [
            null,
            "ธนาคารไทยพาณิชย์ (SCB)",
            "ธนาคารกสิกรไทย(KBANK)",
            "ธนาคารกรุงไทย (KTB)",
            "ธนาคารกรุงเทพ (BBL)",
            "ธนาคารกรุงศรี (BAY)",
            "ธนาคารทหารไทยธนชาต (TTB)",
            "ธนาคารออมสิน (GSB)",
          ],
          default: null,
        },
        accountNumber: { type: String, default: "" },
        accountName: { type: String, default: "" },
      },
      truemoney: {
        enabled: { type: Boolean, default: false },
        phone: { type: String, default: "" },
      },
    },

    donationPage: {
      welcomeMessage: { type: String, default: "" },
      thankYouMessage: { type: String, default: "" },
      minAmount: { type: Number, default: 1 },
      // จำนวนอักขระสูงสุดของข้อความโดเนท (0 = ไม่จำกัด)
      charLimit: { type: Number, default: 100 },
      disableFilter: { type: Boolean, default: false },
      filteredWords: { type: [String], default: [] },
      coverImage: { type: String, default: "" },
      backgroundImage: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export default mongoose.model("User", userSchema);
