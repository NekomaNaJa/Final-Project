import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      default: "",
    },
    otpCode: {
      type: String,
      default: "",
    },
    target: {
      type: String,
      trim: true,
      index: true,
      default: "",
    },
    type: {
      type: String,
      enum: ["email", "phone"],
      default: "email",
    },
    purpose: {
      type: String,
      enum: ["verify_email", "verify_phone", "forgot_password", "change_password"],
      default: "verify_email",
      index: true,
    },
    otp: {
      type: String,
      default: "",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 60 * 1000),
      index: { expires: "5m" }, // TTL index auto-deletes expired OTPs
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // MongoDB TTL Index: auto-expire after 5 minutes (300 seconds)
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active OTP by target, purpose, and type
otpSchema.index({ target: 1, purpose: 1, type: 1 });

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;

