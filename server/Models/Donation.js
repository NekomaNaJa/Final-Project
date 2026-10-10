import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    streamerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    donorName: {
      type: String,
      trim: true,
      default: "Anonymous",
      maxlength: 50,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "ยอดเงินบริจาคต้องไม่ต่ำกว่า 1 บาท"],
    },
    message: {
      type: String,
      default: "",
      maxlength: 500,
      trim: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["promptpay", "bank", "truemoney"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    slipImage: {
      type: String,
      default: null,
    },
    transRef: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    ocrResult: {
      verified: { type: Boolean, default: false },
      method: { type: String, default: null },
      transRef: { type: String, default: null },
      amount: { type: Number, default: null },
      bank: { type: String, default: null },
      bankName: { type: String, default: null },
      date: { type: String, default: null },
      message: { type: String, default: null },
      rawPayload: { type: String, default: null },
    },
    missionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mission",
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying streamer donations ordered by newest first
donationSchema.index({ streamerId: 1, createdAt: -1 });
donationSchema.index({ streamerId: 1, status: 1 });

// Unique sparse index on transRef to prevent duplicate slips across the system
donationSchema.index(
  { transRef: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { transRef: { $type: "string" } },
  }
);

const Donation = mongoose.model("Donation", donationSchema);

export default Donation;
