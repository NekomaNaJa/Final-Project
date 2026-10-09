import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Auth & Identity
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, default: null },
    googleId: { type: String, default: null },

    // Profile & User Info (ตรงกับหน้า Account)
    nickname: { type: String, default: "" },
    fullName: { type: String, default: "" },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    gender: {
      type: String,
      enum: ["", "male", "female", "other"],
      default: "",
    },
    birthDate: { type: Date, default: null },
    phone: { type: String, default: "" },
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },

    // สถานะการไลฟ์/เปิดรับเงิน (สำหรับ DonorPage & Dashboard)
    isLive: { type: Boolean, default: true },

    // Social Media (ครบทั้ง 6 แพลตฟอร์ม)
    social: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      youtube: { type: String, default: "" },
      tiktok: { type: String, default: "" },
      twitch: { type: String, default: "" },
      x: { type: String, default: "" },
    },

    // ช่องทางรับเงิน (ตรงกับหน้า Payment)
    payment: {
      promptpay: {
        enabled: { type: Boolean, default: true },
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
          default: "เบอร์โทรศัพท์",
        },
        number: { type: String, default: "0812345678" },
      },
      bank: {
        enabled: { type: Boolean, default: true },
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
          default: "ธนาคารไทยพาณิชย์ (SCB)",
        },
        accountNumber: { type: String, default: "4170606722" },
        accountName: { type: String, default: "มนต์ธร กอเจริญทรัพย์" },
      },
      truemoney: {
        enabled: { type: Boolean, default: false },
        phone: { type: String, default: "" },
      },
    },

    // การตั้งค่าหน้ารับเงิน (ตรงกับหน้า DonatePage & DonorPage)
    donationPage: {
      welcomeMessage: { type: String, default: "" },
      thankYouMessage: { type: String, default: "" },
      minAmount: { type: Number, default: 10 },
      charLimit: { type: Number, default: 100 },
      disableFilter: { type: Boolean, default: false },
      filteredWords: { type: [String], default: [] },
      coverImage: { type: String, default: null },
      backgroundImage: { type: String, default: null },
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
