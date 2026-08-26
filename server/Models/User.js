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
    password: { type: String, default: null },

    googleId: { type: String, default: null },

    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    birthDate: { type: Date, default: null },
    phone: { type: String, default: "" },
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },

    social: {
      youtube: { type: String, default: "" },
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      tiktok: { type: String, default: "" },
      twitch: { type: String, default: "" },
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
      minAmount: { type: Number, default: 0 },
      filteredWords: { type: [String], default: [] },
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
