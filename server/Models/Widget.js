import mongoose from "mongoose";
import crypto from "crypto";

const amountTierSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" },
    min: { type: Number, default: 1 },
    max: { type: Number, default: 999999 },
    image: { type: String, default: null },
    sound: { type: String, default: "mythic-horn" },
  },
  { _id: false }
);

const missionItemSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" },
    name: { type: String, default: "" },
    price: { type: Number, default: 50 },
    currentAmount: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const widgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => crypto.randomUUID(),
    },
    alert: {
      minAmount: { type: Number, default: 10 },
      overlayImage: { type: String, default: null },
      soundPreset: { type: String, default: "mythic-horn" },
      customSoundFile: { type: String, default: null },
      volume: { type: Number, default: 80 },
      ttsEnabled: { type: Boolean, default: true },
      ttsVoice: { type: String, default: "th-female" },
      ttsVolume: { type: Number, default: 80 },
      ttsSpeed: { type: String, default: "1.0x" },
      template: { type: String, default: "{user} โดเนท {amount} บาท" },
      shineEffect: { type: Boolean, default: true },
      fontFamily: { type: String, default: "Kanit" },
      fontWeight: { type: String, default: "700" },
      fontSize: { type: Number, default: 28 },
      textColor: { type: String, default: "#ffffff" },
      strokeSize: { type: Number, default: 2 },
      strokeColor: { type: String, default: "#000000" },
      userNameColor: { type: String, default: "#c084fc" },
      amountColor: { type: String, default: "#fbbf24" },
      animationIn: { type: String, default: "bounceIn" },
      animationOut: { type: String, default: "fadeOut" },
      durationIn: { type: Number, default: 0.8 },
      durationDisplay: { type: Number, default: 5 },
      durationOut: { type: Number, default: 0.8 },
      filterEffect: { type: String, default: "Glow" },
      useAmountTiers: { type: Boolean, default: false },
      amountTiers: {
        type: [amountTierSchema],
        default: [
          { id: "tier-1", min: 1, max: 99, image: null, sound: "mythic-horn" },
          { id: "tier-2", min: 100, max: 499, image: null, sound: "dragon-roar" },
          { id: "tier-3", min: 500, max: 999999, image: null, sound: "ancient-bell" },
        ],
      },
    },
    goal: {
      title: { type: String, default: "เป้าหมายพัฒนาสตรีม" },
      theme: { type: String, default: "mana" },
      target: { type: Number, default: 10000 },
      current: { type: Number, default: 0 },
      startDate: { type: String, default: "2026-09-01" },
      endDate: { type: String, default: "2026-09-30" },
    },
    leaderboard: {
      title: { type: String, default: "TOP DONORS ประจำเดือน" },
      showAmount: { type: Boolean, default: true },
      startDate: { type: String, default: "2026-09-01" },
      endDate: { type: String, default: "2026-09-30" },
      limit: { type: Number, default: 5 },
    },
    mission: {
      title: { type: String, default: "ภารกิจสตรีมเมอร์วันนี้" },
      missions: {
        type: [missionItemSchema],
        default: [
          { id: "m-1", name: "เล่นเกมมือเดียว 1 ตา", price: 50, currentAmount: 0, completed: false },
          { id: "m-2", name: "ดื่มน้ำ 1 แก้วใหญ่", price: 20, currentAmount: 0, completed: false },
          { id: "m-3", name: "ร้องเพลงตามคำขอ 1 เพลง", price: 100, currentAmount: 0, completed: false },
          { id: "m-4", name: "เล่นตัวละครที่คนดูโหวต", price: 150, currentAmount: 0, completed: false },
        ],
      },
    },
  },
  { timestamps: true }
);

const Widget = mongoose.model("Widget", widgetSchema);

export default Widget;
