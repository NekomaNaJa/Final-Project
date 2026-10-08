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
      default: "ผู้ไม่ประสงค์ออกนาม",
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ["promptpay", "bank", "truemoney"],
      required: true,
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
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast querying and aggregation
donationSchema.index({ streamerId: 1, createdAt: -1 });
donationSchema.index({ streamerId: 1, status: 1 });

const Donation = mongoose.model("Donation", donationSchema);

export default Donation;
