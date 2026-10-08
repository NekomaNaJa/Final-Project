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

const Donation = mongoose.model("Donation", donationSchema);

export default Donation;
