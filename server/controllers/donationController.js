import mongoose from "mongoose";
import User from "../Models/User.js";
import Donation from "../Models/Donation.js";
import Widget from "../Models/Widget.js";
import slipVerificationService from "../services/slipVerificationService.js";

const THAI_DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const THAI_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];
const DONOR_BADGES = ["MYTHIC", "ARCANE", "RUNE", "MANA", "ACOLYTE"];

/**
 * ตรวจสอบความถูกต้องของข้อมูลเบื้องต้นสำหรับการสร้างการโดเนท
 */
const validateDonationInput = (body) => {
  const { username, amount, paymentMethod, slipImage } = body;
  const numAmount = amount !== undefined && amount !== null ? Number(amount) : null;

  if (
    typeof username !== "string" ||
    !username.trim() ||
    typeof paymentMethod !== "string"
  ) {
    return "ข้อมูลไม่ถูกต้อง";
  }

  if (!["promptpay", "bank"].includes(paymentMethod)) {
    return "ช่องทางการชำระเงินไม่ถูกต้อง";
  }

  // กรณีโอนผ่านธนาคารพร้อมแนบสลิป ไม่จำเป็นต้องกรอกจำนวนเงิน (ระบบจะอ่านยอดจากสลิปอัตโนมัติ)
  if (paymentMethod === "bank" && typeof slipImage === "string" && slipImage.trim()) {
    if (numAmount !== null && (Number.isNaN(numAmount) || numAmount <= 0)) {
      return "จำนวนเงินต้องมากกว่า 0 บาท";
    }
    return null;
  }

  // สำหรับกรณีอื่นๆ ต้องระบุจำนวนเงินที่ถูกต้อง
  if (numAmount === null || Number.isNaN(numAmount) || typeof amount === "boolean") {
    return "ข้อมูลไม่ถูกต้อง";
  }

  if (numAmount <= 0) {
    return "จำนวนเงินต้องมากกว่า 0 บาท";
  }

  return null;
};

/**
 * กรองคำหยาบและปรับปรุงข้อความโดเนท
 */
const sanitizeDonationMessage = (message, donationPage) => {
  if (typeof message !== "string") return "";
  let cleanMessage = String(message).trim().slice(0, 500);

  if (
    donationPage?.disableFilter ||
    !Array.isArray(donationPage?.filteredWords)
  ) {
    return cleanMessage;
  }

  donationPage.filteredWords.forEach((badWord) => {
    if (typeof badWord === "string" && badWord.trim()) {
      const escaped = badWord
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
      const regex = new RegExp(escaped, "gi");
      cleanMessage = cleanMessage.replace(regex, "***");
    }
  });

  return cleanMessage;
};

/**
 * สร้างรายการบริจาคใหม่สำหรับหน้า Donor (POST /api/donations)
 * สาธารณะ: ไม่ต้องเข้าสู่ระบบ ผู้สนับสนุนส่งการบริจาคพร้อมสลิปได้
 */
export const createDonation = async (req, res, next) => {
  try {
    const { username, donorName, amount, message, paymentMethod, slipImage } =
      req.body;

    // 1. ตรวจสอบชนิดข้อมูลพื้นฐาน
    const validationError = validateDonationInput(req.body);
    if (validationError) {
      return res.status(400).json({
        message: validationError,
        data: null,
      });
    }

    // 2. ตัดสาย taint และป้องกัน NoSQL injection
    let effectiveAmount =
      amount !== undefined &&
      amount !== null &&
      !Number.isNaN(Number(amount)) &&
      Number(amount) > 0
        ? Number(amount)
        : null;

    const safeUsername = String(username).trim();
    const streamer = await User.findOne({ username: { $eq: safeUsername } });

    if (!streamer) {
      return res.status(404).json({
        message: "ไม่พบสตรีมเมอร์นี้",
        data: null,
      });
    }

    // 3. ตรวจสอบยอดเงินขั้นต่ำ (ถ้ามีการระบุยอดเงินล่วงหน้า)
    const minAmount =
      typeof streamer.donationPage?.minAmount === "number"
        ? streamer.donationPage.minAmount
        : 1;

    if (effectiveAmount !== null && effectiveAmount < minAmount) {
      return res.status(400).json({
        message: `จำนวนเงินต้องไม่ต่ำกว่ายอดขั้นต่ำ ${minAmount} บาท`,
        data: null,
      });
    }

    // 5. ตรวจสอบว่าช่องทางนั้นเปิดรับเงินหรือไม่
    const channelConfig = streamer.payment?.[paymentMethod];
    if (!channelConfig?.enabled) {
      return res.status(400).json({
        message: "ช่องทางการชำระเงินนี้ไม่พร้อมให้บริการ",
        data: null,
      });
    }

    // 6. กรองข้อความและชื่อผู้บริจาค
    let safeMessage = sanitizeDonationMessage(message, streamer.donationPage);
    const rawDonorName =
      typeof donorName === "string" && donorName.trim()
        ? String(donorName).trim().slice(0, 50)
        : "Anonymous";
    const safeDonorName =
      sanitizeDonationMessage(rawDonorName, streamer.donationPage) || "Anonymous";

    const safeSlipImage =
      typeof slipImage === "string" && slipImage.trim()
        ? String(slipImage)
        : null;

    // 7. ตรวจสอบสลิปด้วย OCR / QR Slip Verification Engine (Phase 8)
    let ocrResult = {
      verified: false,
      method: "none",
      transRef: null,
      amount: null,
      bank: null,
      bankName: null,
      message: null,
      rawPayload: null,
    };
    let initialStatus = "pending";
    let safeTransRef = null;

    // 7. การตรวจสอบสลิปการโอนเงิน (Slip Verification & Auto-Approve OCR)
    const autoApprove = streamer.donationPage?.autoApproveSlip !== false;

    if (safeSlipImage && (paymentMethod === "promptpay" || paymentMethod === "bank")) {
      const bankConfig = streamer.payment?.bank;
      const promptpayConfig = streamer.payment?.promptpay;

      const expectedAccountName =
        bankConfig?.accountName ||
        streamer.fullName ||
        [streamer.firstName, streamer.lastName].filter(Boolean).join(" ").trim() ||
        null;

      const expectedAccountNumber =
        paymentMethod === "bank"
          ? bankConfig?.accountNumber
          : promptpayConfig?.number;

      // หากสตรีมเมอร์ปิด autoApprove ให้ส่ง skipOcr: true เพื่อสแกนเฉพาะ QR code (~20ms) และข้าม Tesseract OCR ทั้งหมด
      const verification = await slipVerificationService.verifySlipImage(safeSlipImage, effectiveAmount, {
        expectedAccountName,
        expectedAccountNumber,
        skipOcr: !autoApprove,
      });

      if (verification?.success) {
        safeTransRef = verification.transRef ? String(verification.transRef).trim() : null;

        // 7.1 ป้องกันสลิปซ้ำ (Duplicate Slip Prevention)
        if (safeTransRef) {
          const duplicate = await Donation.findOne({
            transRef: { $eq: safeTransRef },
          });
          if (duplicate) {
            const isRecentSubmission =
              duplicate.streamerId &&
              streamer._id &&
              duplicate.streamerId.toString() === streamer._id.toString() &&
              duplicate.createdAt &&
              Date.now() - new Date(duplicate.createdAt).getTime() < 15000;

            if (isRecentSubmission) {
              return res.status(200).json({
                message: "การบริจาคสำเร็จและสลิปผ่านการตรวจสอบอัตโนมัติ",
                data: duplicate,
              });
            }

            return res.status(400).json({
              message: `สลิปนี้ถูกใช้งานไปแล้ว (รหัสอ้างอิง: ${safeTransRef}) ไม่สามารถใช้ซ้ำได้`,
              data: null,
            });
          }
        }

        // 7.2 ตรวจสอบชื่อผู้รับเงินในสลิป ให้ตรงกับชื่อบัญชีของสตรีมเมอร์ (ทั้ง Bank และ PromptPay)
        const streamerAccountDisplayName =
          paymentMethod === "bank" && bankConfig?.accountName
            ? bankConfig.accountName
            : expectedAccountName || expectedAccountNumber || "สตรีมเมอร์";

        if (
          (expectedAccountName || expectedAccountNumber) &&
          verification.recipientMatched === false &&
          verification.accountNumberMatched !== true
        ) {
          return res.status(400).json({
            message: `ชื่อผู้รับเงินในสลิปไม่ตรงกับชื่อบัญชีของสตรีมเมอร์ (${streamerAccountDisplayName})`,
            data: null,
          });
        }

        // 7.3 หากไม่ได้ระบุจำนวนเงินมา ให้ดึงจำนวนเงินจากสลิปอัตโนมัติ
        if (
          effectiveAmount === null &&
          typeof verification.amount === "number" &&
          verification.amount > 0
        ) {
          effectiveAmount = verification.amount;
        }

        // 7.4 ตรวจสอบยอดเงินในสลิป (Amount Mismatch Check)
        if (
          effectiveAmount !== null &&
          typeof verification.amount === "number" &&
          verification.amount < effectiveAmount
        ) {
          return res.status(400).json({
            message: `ยอดเงินในสลิป (${verification.amount} บาท) น้อยกว่ายอดเงินที่แจ้งบริจาค (${effectiveAmount} บาท)`,
            data: null,
          });
        }

        // 7.5 ตรวจสอบยอดเงินขั้นต่ำหลังอ่านจากสลิป
        if (effectiveAmount !== null && effectiveAmount < minAmount) {
          return res.status(400).json({
            message: `ยอดเงินในสลิป (${effectiveAmount} บาท) ต่ำกว่ายอดเงินขั้นต่ำที่กำหนด (${minAmount} บาท)`,
            data: null,
          });
        }

        // 7.6 ตรวจสอบการตั้งค่า Auto-Approve ของสตรีมเมอร์
        if (autoApprove) {
          initialStatus = "approved";
        } else {
          initialStatus = "pending";
        }

        ocrResult = {
          verified: true,
          method: verification.method || "qr",
          transRef: safeTransRef,
          amount: verification.amount || effectiveAmount || null,
          bank: verification.bankCode || null,
          bankName: verification.bankName || null,
          message: autoApprove
            ? "ตรวจสอบสลิปและอนุมัติอัตโนมัติสำเร็จ"
            : "สลิปถูกต้องตามเงื่อนไข (รอการยืนยันจากสตรีมเมอร์)",
          rawPayload: verification.rawPayload || null,
        };
      } else {
        // หากสลิปอ่านไม่ผ่าน และไม่มีการระบุจำนวนเงินมาด้วย
        if (!autoApprove && effectiveAmount === null) {
          // โหมด Manual: ถ้าไม่ได้ระบุจำนวนเงินมา ให้ใช้ minAmount ชั่วคราวเพื่อให้สตรีมเมอร์ตรวจสอบเอง
          effectiveAmount = minAmount;
        } else if (effectiveAmount === null) {
          return res.status(400).json({
            message: "ไม่สามารถอ่านจำนวนเงินหรือข้อมูลจากรูปภาพสลิปได้ กรุณาใช้สลิปที่มีความคมชัด",
            data: null,
          });
        }

        ocrResult = {
          verified: false,
          method: "none",
          transRef: null,
          amount: null,
          bank: null,
          bankName: null,
          message: !autoApprove
            ? "รอการยืนยันจากสตรีมเมอร์ (โหมดตรวจสอบด้วยตนเอง)"
            : verification?.message || "ไม่สามารถอ่าน QR Code หรือข้อความบนสลิปได้อัตโนมัติ",
          rawPayload: null,
        };
      }
    }

    // กรณีไม่มีการอ่านสลิปและไม่ได้ระบุจำนวนเงินมา
    if (effectiveAmount === null || effectiveAmount <= 0) {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
        data: null,
      });
    }

    // 7.7 ตรวจสอบราคาภารกิจสำหรับช่องทาง Bank (Bank Mission Price Verification)
    // หากเลือกภารกิจแต่ยอดเงินจากสลิป < ราคาภารกิจ (แต่ >= minAmount) ให้ตัดแท็กภารกิจออกจากข้อความบน Alert และในระบบ
    if (paymentMethod === "bank" && typeof safeMessage === "string") {
      const missionRegex = /^\[ภารกิจ:\s*(.+?)\s*\]\s*/;
      const missionMatch = safeMessage.match(missionRegex);
      const reqMissionPrice =
        req.body?.missionPrice !== undefined &&
        req.body?.missionPrice !== null &&
        !Number.isNaN(Number(req.body.missionPrice)) &&
        Number(req.body.missionPrice) > 0
          ? Number(req.body.missionPrice)
          : null;

      if (missionMatch || reqMissionPrice !== null) {
        const detectedMissionName = missionMatch
          ? missionMatch[1].trim()
          : (typeof req.body?.missionName === "string" ? req.body.missionName.trim() : "");
        let targetMissionPrice = reqMissionPrice;

        try {
          const widget = await Widget.findOne({ userId: { $eq: streamer._id } });
          if (widget?.mission?.missions && Array.isArray(widget.mission.missions)) {
            const foundMission = widget.mission.missions.find((m) => {
              if (req.body?.missionId && String(m.id) === String(req.body.missionId)) return true;
              if (detectedMissionName && m.name && m.name.trim() === detectedMissionName) return true;
              return false;
            });
            if (foundMission && typeof foundMission.price === "number") {
              targetMissionPrice = foundMission.price;
            }
          }
        } catch {
          // หากค้นหา widget ไม่สำเร็จ ใช้ targetMissionPrice ที่ได้จาก req.body
        }

        if (targetMissionPrice !== null && effectiveAmount < targetMissionPrice) {
          safeMessage = safeMessage.replace(missionRegex, "").trim();
        }
      }
    }

    // 8. บันทึกลงฐานข้อมูล MongoDB
    const donation = new Donation({
      streamerId: streamer._id,
      donorName: safeDonorName,
      amount: effectiveAmount,
      message: safeMessage,
      paymentMethod,
      status: initialStatus,
      slipImage: safeSlipImage,
      transRef: safeTransRef,
      ocrResult,
    });

    await donation.save();

    // 9. Real-time Notification ผ่าน Socket.IO (เฉพาะรายการที่อนุมัติแล้วเท่านั้น)
    if (req.io && initialStatus === "approved") {
      const alertPayload = {
        id: donation._id,
        donorName: donation.donorName,
        amount: donation.amount,
        message: donation.message,
        paymentMethod: donation.paymentMethod,
        status: donation.status,
        createdAt: donation.createdAt,
        transRef: donation.transRef,
        ocrResult: donation.ocrResult,
      };

      const targetRooms = Array.from(
        new Set(
          [
            `streamer_${streamer._id}`,
            String(streamer._id),
            streamer.username ? `streamer_${streamer.username}` : null,
            streamer.username ? String(streamer.username) : null,
          ].filter(Boolean)
        )
      );

      req.io.to(targetRooms).emit("donation-alert", alertPayload);
    }

    const responseMessage =
      initialStatus === "approved"
        ? "การบริจาคสำเร็จและสลิปผ่านการตรวจสอบอัตโนมัติ"
        : "สร้างรายการโดเนทสำเร็จ";

    return res.status(201).json({
      message: responseMessage,
      data: donation,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ดึงรายการบริจาคของสตรีมเมอร์ (GET /api/donations)
 * รองรับ query: page, limit, status, search
 */
export const getDonations = async (req, res, next) => {
  try {
    const rawUserId = req.user?.userId;
    if (!rawUserId || !mongoose.isValidObjectId(rawUserId)) {
      return res.status(401).json({
        message: "ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ",
        data: null,
      });
    }

    const streamerObjectId = new mongoose.Types.ObjectId(String(rawUserId));

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const { status, search } = req.query;

    const query = {
      streamerId: { $eq: streamerObjectId },
    };

    if (status && typeof status === "string") {
      const safeStatus = String(status).trim().toLowerCase();
      if (["pending", "approved", "rejected"].includes(safeStatus)) {
        query.status = { $eq: safeStatus };
      }
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const safeSearch = String(search)
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
      query.$or = [
        { donorName: { $regex: safeSearch, $options: "i" } },
        { message: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const total = await Donation.countDocuments(query);
    const skip = (page - 1) * limit;

    const donations = await Donation.find(query)
      .select("-slipImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      message: "ดึงรายการบริจาคสำเร็จ",
      data: {
        donations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ดึงข้อมูลสถิติสำหรับหน้า Dashboard (GET /api/donations/stats)
 * สรุปผลด้วย MongoDB Aggregation
 */
export const getDonationStats = async (req, res, next) => {
  try {
    const rawUserId = req.user?.userId;
    if (!rawUserId || !mongoose.isValidObjectId(rawUserId)) {
      return res.status(401).json({
        message: "ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ",
        data: null,
      });
    }

    const streamerObjectId = new mongoose.Types.ObjectId(String(rawUserId));

    // 1. กำหนดช่วงเวลาล่วงหน้าสำหรับการรวมข้อมูลและเปรียบเทียบสถิติ
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const currentYear = new Date().getFullYear();

    const now = new Date();
    const sevenDaysAgoCutoff = new Date(now);
    sevenDaysAgoCutoff.setDate(sevenDaysAgoCutoff.getDate() - 7);
    const fourteenDaysAgoCutoff = new Date(now);
    fourteenDaysAgoCutoff.setDate(fourteenDaysAgoCutoff.getDate() - 14);

    const fetchStreamerPayment = async () => {
      try {
        const streamer = await User.findById(streamerObjectId).select("payment");
        return streamer?.payment || null;
      } catch {
        return null;
      }
    };

    // รันการสืบค้นข้อมูลทั้งหมดพร้อมกันแบบคู่ขนาน (Concurrent Parallel Queries)
    // ลด Round-Trip Latency ไปยัง MongoDB Atlas จาก 9 ครั้งติดต่อกันเหลือเพียง 1 ช่วงเวลา
    const [
      summaryAgg,
      topDonorsAgg,
      daily7Agg,
      daily30Agg,
      monthlyAgg,
      weekComparisonAgg,
      pendingCount,
      payment,
      recentDonations,
    ] = await Promise.all([
      // 1. ผลรวมยอดเงินและจำนวนครั้งที่ได้รับการสนับสนุน (สถานะ approved)
      Donation.aggregate([
        {
          $match: {
            streamerId: streamerObjectId,
            status: "approved",
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            totalDonations: { $sum: 1 },
          },
        },
      ]),
      // 2. รายชื่อผู้สนับสนุนอันดับต้นๆ (Top Donors)
      Donation.aggregate([
        {
          $match: {
            streamerId: streamerObjectId,
            status: "approved",
          },
        },
        {
          $group: {
            _id: "$donorName",
            totalAmount: { $sum: "$amount" },
            donationCount: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 },
      ]),
      // 3. สถิติสำหรับวาดกราฟ 7 วัน
      Donation.aggregate([
        {
          $match: {
            streamerId: streamerObjectId,
            status: "approved",
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "+07:00",
              },
            },
            amount: { $sum: "$amount" },
          },
        },
      ]),
      // 4. สถิติสำหรับวาดกราฟ 30 วัน
      Donation.aggregate([
        {
          $match: {
            streamerId: streamerObjectId,
            status: "approved",
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "+07:00",
              },
            },
            amount: { $sum: "$amount" },
          },
        },
      ]),
      // 5. สถิติสำหรับวาดกราฟทั้งปี
      Donation.aggregate([
        {
          $match: {
            streamerId: streamerObjectId,
            status: "approved",
            createdAt: {
              $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
            },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            amount: { $sum: "$amount" },
          },
        },
      ]),
      // 6. สถิติเปรียบเทียบสัปดาห์ปัจจุบันเทียบกับสัปดาห์ที่ผ่านมา (Week-over-Week)
      Donation.aggregate([
        {
          $match: {
            streamerId: streamerObjectId,
            status: "approved",
            createdAt: { $gte: fourteenDaysAgoCutoff },
          },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $gte: ["$createdAt", sevenDaysAgoCutoff] },
                "currentWeek",
                "previousWeek",
              ],
            },
            totalAmount: { $sum: "$amount" },
            totalDonations: { $sum: 1 },
          },
        },
      ]),
      // 7. จำนวนรายการที่รอตรวจสอบ
      Donation.countDocuments({
        streamerId: { $eq: streamerObjectId },
        status: { $eq: "pending" },
      }),
      // 8. ข้อมูลช่องทางรับเงินของสตรีมเมอร์
      fetchStreamerPayment(),
      // 9. รายการบริจาคล่าสุด 5 รายการสำหรับ RealtimeFeed
      Donation.find({
        streamerId: { $eq: streamerObjectId },
        status: { $eq: "approved" },
      })
        .select("-slipImage")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const totalAmount = summaryAgg[0]?.totalAmount || 0;
    const totalDonations = summaryAgg[0]?.totalDonations || 0;

    const topDonors = topDonorsAgg.map((item, index) => ({
      rank: index + 1,
      name: item._id || "ผู้ไม่ประสงค์ออกนาม",
      totalAmount: item.totalAmount,
      donationCount: item.donationCount,
      badge: DONOR_BADGES[index] || "SUPPORTER",
    }));

    const daily7Map = new Map();
    daily7Agg.forEach((d) => daily7Map.set(d._id, d.amount));

    const chart7D = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateKey = `${yyyy}-${mm}-${dd}`;
      chart7D.push({
        d: THAI_DAYS[d.getDay()],
        date: dateKey,
        amount: daily7Map.get(dateKey) || 0,
      });
    }

    const daily30Map = new Map();
    daily30Agg.forEach((d) => daily30Map.set(d._id, d.amount));

    const chart30D = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateKey = `${yyyy}-${mm}-${dd}`;
      chart30D.push({
        d: String(d.getDate()),
        date: dateKey,
        amount: daily30Map.get(dateKey) || 0,
      });
    }

    const monthlyMap = new Map();
    monthlyAgg.forEach((m) => monthlyMap.set(m._id, m.amount));

    const currentMonthIndex = new Date().getMonth();
    const chartAll = [];
    const maxMonths = Math.max(currentMonthIndex, 5);
    for (let m = 0; m <= maxMonths; m++) {
      chartAll.push({
        d: THAI_MONTHS[m],
        month: m + 1,
        amount: monthlyMap.get(m + 1) || 0,
      });
    }

    let currentWeekAmount = 0;
    let currentWeekDonations = 0;
    let previousWeekAmount = 0;
    let previousWeekDonations = 0;

    weekComparisonAgg.forEach((item) => {
      if (item._id === "currentWeek") {
        currentWeekAmount = item.totalAmount || 0;
        currentWeekDonations = item.totalDonations || 0;
      } else if (item._id === "previousWeek") {
        previousWeekAmount = item.totalAmount || 0;
        previousWeekDonations = item.totalDonations || 0;
      }
    });

    const calculatePercentChange = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return Math.round(((current - previous) / previous) * 100);
    };

    const amountPercentChange = calculatePercentChange(
      currentWeekAmount,
      previousWeekAmount
    );
    const donationsPercentChange = calculatePercentChange(
      currentWeekDonations,
      previousWeekDonations
    );

    return res.json({
      message: "ดึงข้อมูลสถิติสำเร็จ",
      data: {
        totalAmount,
        totalDonations,
        pendingCount,
        amountPercentChange,
        donationsPercentChange,
        topDonors,
        chartData: {
          "7D": chart7D,
          "30D": chart30D,
          ALL: chartAll,
        },
        recentDonations,
        payment,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * เปลี่ยนสถานะรายการบริจาค (PATCH /api/donations/:id)
 * สถานะ: approved หรือ rejected
 * เมื่อ approved จะยิง event "donation-alert" ผ่าน Socket.IO
 */
export const updateDonationStatus = async (req, res, next) => {
  try {
    const rawUserId = req.user?.userId;
    if (!rawUserId || !mongoose.isValidObjectId(rawUserId)) {
      return res.status(401).json({
        message: "ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ",
        data: null,
      });
    }

    const { id } = req.params;
    if (!id || typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "ID รายการบริจาคไม่ถูกต้อง",
        data: null,
      });
    }

    const { status } = req.body;
    if (typeof status !== "string") {
      return res.status(400).json({
        message: "สถานะไม่ถูกต้อง",
        data: null,
      });
    }

    const safeStatus = String(status).trim().toLowerCase();
    if (!["approved", "rejected"].includes(safeStatus)) {
      return res.status(400).json({
        message: "สถานะต้องเป็น approved หรือ rejected",
        data: null,
      });
    }

    const donationObjectId = new mongoose.Types.ObjectId(String(id));
    const donation = await Donation.findById(donationObjectId);

    if (!donation) {
      return res.status(404).json({
        message: "ไม่พบรายการบริจาค",
        data: null,
      });
    }

    if (donation.streamerId.toString() !== String(rawUserId)) {
      return res.status(403).json({
        message: "ไม่มีสิทธิ์จัดการรายการบริจาคนี้",
        data: null,
      });
    }

    donation.status = safeStatus;
    await donation.save();

    if (safeStatus === "approved" && req.io) {
      const targetRooms = [
        `streamer_${donation.streamerId}`,
        String(donation.streamerId),
      ];
      req.io.to(targetRooms).emit("donation-alert", donation);
    }

    return res.json({
      message:
        safeStatus === "approved"
          ? "อนุมัติรายการบริจาคสำเร็จ"
          : "ปฏิเสธรายการบริจาคสำเร็จ",
      data: donation,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ดึงรูปภาพสลิปสำหรับรายการบริจาคที่เลือก (GET /api/donations/:id/slip)
 * ดึงเฉพาะเมื่อผู้ใช้ต้องการเปิดดูสลิปใน Modal เพื่อลดภาระ payload บนหน้าเว็บ
 */
export const getDonationSlip = async (req, res, next) => {
  try {
    const rawUserId = req.user?.userId;
    if (!rawUserId || !mongoose.isValidObjectId(rawUserId)) {
      return res.status(401).json({
        message: "ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ",
        data: null,
      });
    }

    const { id } = req.params;
    if (!id || typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "ID รายการบริจาคไม่ถูกต้อง",
        data: null,
      });
    }

    const donationObjectId = new mongoose.Types.ObjectId(String(id));
    const streamerObjectId = new mongoose.Types.ObjectId(String(rawUserId));

    const donation = await Donation.findOne({
      _id: { $eq: donationObjectId },
    }).select("slipImage streamerId");

    if (!donation) {
      return res.status(404).json({
        message: "ไม่พบรายการบริจาค",
        data: null,
      });
    }

    if (donation.streamerId.toString() !== streamerObjectId.toString()) {
      return res.status(403).json({
        message: "ไม่มีสิทธิ์เข้าถึงรายการบริจาคนี้",
        data: null,
      });
    }

    return res.json({
      message: "ดึงรูปสลิปสำเร็จ",
      data: {
        slipImage: donation.slipImage,
      },
    });
  } catch (err) {
    next(err);
  }
};

