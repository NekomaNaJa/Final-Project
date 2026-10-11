import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    target: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["email", "phone"],
      required: true,
    },
    purpose: {
      type: String,
      enum: ["verify_email", "verify_phone", "forgot_password"],
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
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
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active OTP by target, purpose, and type
otpSchema.index({ target: 1, purpose: 1, type: 1 });

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
