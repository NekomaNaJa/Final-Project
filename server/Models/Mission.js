import mongoose from "mongoose";

const missionSchema = new mongoose.Schema(
  {
    streamerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    price: {
      type: Number,
      required: true,
      min: [1, "ยอดเงินเป้าหมายต้องไม่ต่ำกว่า 1 บาท"],
    },
    currentAmount: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

const Mission = mongoose.model("Mission", missionSchema);

export default Mission;
