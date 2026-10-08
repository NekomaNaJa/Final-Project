import User from "../Models/User.js";
import Donation from "../Models/Donation.js";

/**
 * สร้างรายการบริจาคใหม่สำหรับหน้า Donor (POST /api/donations)
 * สาธารณะ: ไม่ต้องเข้าสู่ระบบ ผู้สนับสนุนส่งการบริจาคพร้อมสลิปได้
 */
export const createDonation = async (req, res, next) => {
  try {
    const { username, donorName, amount, message, paymentMethod, slipImage } =
      req.body;

    // 1. ตรวจสอบชนิดข้อมูลพื้นฐาน
    if (
      typeof username !== "string" ||
      !username.trim() ||
      typeof amount !== "number" ||
      isNaN(amount) ||
      typeof paymentMethod !== "string"
    ) {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
        data: null,
      });
    }

    if (!["promptpay", "bank", "truemoney"].includes(paymentMethod)) {
      return res.status(400).json({
        message: "ช่องทางการชำระเงินไม่ถูกต้อง",
        data: null,
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        message: "จำนวนเงินต้องมากกว่า 0 บาท",
        data: null,
      });
    }

    // 2. ตัดสาย taint และป้องกัน NoSQL injection
    const safeUsername = String(username).trim();
    const streamer = await User.findOne({ username: { $eq: safeUsername } });

    if (!streamer) {
      return res.status(404).json({
        message: "ไม่พบสตรีมเมอร์นี้",
        data: null,
      });
    }

    // 3. ตรวจสอบสถานะการเปิดรับเงิน (isLive)
    if (!streamer.isLive) {
      return res.status(400).json({
        message: "ขณะนี้สตรีมเมอร์ปิดรับโดเนทชั่วคราว",
        data: null,
      });
    }

    // 4. ตรวจสอบยอดเงินขั้นต่ำ
    const minAmount =
      typeof streamer.donationPage?.minAmount === "number"
        ? streamer.donationPage.minAmount
        : 1;

    if (amount < minAmount) {
      return res.status(400).json({
        message: `จำนวนเงินต้องไม่ต่ำกว่ายอดขั้นต่ำ ${minAmount} บาท`,
        data: null,
      });
    }

    // 5. ตรวจสอบว่าช่องทางนั้นเปิดรับเงินหรือไม่
    const channelConfig = streamer.payment?.[paymentMethod];
    if (!channelConfig || !channelConfig.enabled) {
      return res.status(400).json({
        message: "ช่องทางการชำระเงินนี้ไม่พร้อมให้บริการ",
        data: null,
      });
    }

    // 6. กรองข้อความและคำหยาบ
    let safeMessage =
      typeof message === "string" ? String(message).trim().slice(0, 500) : "";

    const disableFilter = streamer.donationPage?.disableFilter;
    const filteredWords = streamer.donationPage?.filteredWords;

    if (!disableFilter && Array.isArray(filteredWords)) {
      filteredWords.forEach((badWord) => {
        if (badWord && typeof badWord === "string" && badWord.trim()) {
          const escaped = badWord
            .trim()
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(escaped, "gi");
          safeMessage = safeMessage.replace(regex, "***");
        }
      });
    }

    const safeDonorName =
      typeof donorName === "string" && donorName.trim()
        ? String(donorName).trim().slice(0, 50)
        : "Anonymous";

    const safeSlipImage =
      typeof slipImage === "string" && slipImage.trim()
        ? String(slipImage)
        : null;

    // 7. บันทึกลงฐานข้อมูล MongoDB
    const donation = new Donation({
      streamerId: streamer._id,
      donorName: safeDonorName,
      amount,
      message: safeMessage,
      paymentMethod,
      status: "pending",
      slipImage: safeSlipImage,
    });

    await donation.save();

    // 8. Real-time Notification ผ่าน Socket.IO (เตรียมสำหรับ Phase 7)
    if (req.io) {
      req.io.to(`streamer_${streamer._id}`).emit("donation-alert", {
        id: donation._id,
        donorName: donation.donorName,
        amount: donation.amount,
        message: donation.message,
        paymentMethod: donation.paymentMethod,
        status: donation.status,
        createdAt: donation.createdAt,
      });
    }

    return res.status(201).json({
      message: "สร้างรายการโดเนทสำเร็จ",
      data: donation,
    });
  } catch (err) {
    next(err);
  }
};
