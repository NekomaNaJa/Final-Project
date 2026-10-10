import mongoose from "mongoose";
import User from "../Models/User.js";
import Donation from "../Models/Donation.js";
import { verifySlipImage } from "../services/slipVerificationService.js";

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
  const { username, amount, paymentMethod } = body;

  if (
    typeof username !== "string" ||
    !username.trim() ||
    typeof amount !== "number" ||
    Number.isNaN(amount) ||
    typeof paymentMethod !== "string"
  ) {
    return "ข้อมูลไม่ถูกต้อง";
  }

  if (!["promptpay", "bank", "truemoney"].includes(paymentMethod)) {
    return "ช่องทางการชำระเงินไม่ถูกต้อง";
  }

  if (amount <= 0) {
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
    const safeUsername = String(username).trim();
    const streamer = await User.findOne({ username: { $eq: safeUsername } });

    if (!streamer) {
      return res.status(404).json({
        message: "ไม่พบสตรีมเมอร์นี้",
        data: null,
      });
    }

    // 3. ตรวจสอบยอดเงินขั้นต่ำ
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
    if (!channelConfig?.enabled) {
      return res.status(400).json({
        message: "ช่องทางการชำระเงินนี้ไม่พร้อมให้บริการ",
        data: null,
      });
    }

    // 6. กรองข้อความและชื่อผู้บริจาค
    const safeMessage = sanitizeDonationMessage(message, streamer.donationPage);
    const safeDonorName =
      typeof donorName === "string" && donorName.trim()
        ? String(donorName).trim().slice(0, 50)
        : "Anonymous";

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

    if (safeSlipImage && (paymentMethod === "promptpay" || paymentMethod === "bank")) {
      const verification = await verifySlipImage(safeSlipImage, amount);
      if (verification?.success) {
        safeTransRef = verification.transRef ? String(verification.transRef).trim() : null;

        // 7.1 ป้องกันสลิปซ้ำ (Duplicate Slip Prevention)
        if (safeTransRef) {
          const duplicate = await Donation.findOne({
            transRef: { $eq: safeTransRef },
          });
          if (duplicate) {
            return res.status(400).json({
              message: `สลิปนี้ถูกใช้งานไปแล้ว (รหัสอ้างอิง: ${safeTransRef}) ไม่สามารถใช้ซ้ำได้`,
              data: null,
            });
          }
        }

        // 7.2 ตรวจสอบยอดเงินในสลิป (Amount Mismatch Check)
        if (typeof verification.amount === "number" && verification.amount < amount) {
          return res.status(400).json({
            message: `ยอดเงินในสลิป (${verification.amount} บาท) น้อยกว่ายอดเงินที่แจ้งบริจาค (${amount} บาท)`,
            data: null,
          });
        }

        // 7.3 ตรวจสอบการตั้งค่า Auto-Approve ของสตรีมเมอร์ (ค่าเริ่มต้น: true)
        const autoApprove = streamer.donationPage?.autoApproveSlip !== false;
        if (autoApprove) {
          initialStatus = "approved";
        }

        ocrResult = {
          verified: true,
          method: verification.method || "qr",
          transRef: safeTransRef,
          amount: verification.amount || null,
          bank: verification.bankCode || null,
          bankName: verification.bankName || null,
          message: autoApprove
            ? "ตรวจสอบสลิปและอนุมัติอัตโนมัติสำเร็จ"
            : "สลิปถูกต้องตามเงื่อนไข (รอการยืนยันจากสตรีมเมอร์)",
          rawPayload: verification.rawPayload || null,
        };
      } else {
        // หากไม่สามารถอ่าน QR Code ได้ ให้เก็บสถานะเป็น pending เพื่อให้สตรีมเมอร์ตรวจเอง
        ocrResult = {
          verified: false,
          method: "none",
          transRef: null,
          amount: null,
          bank: null,
          bankName: null,
          message: verification?.message || "ไม่สามารถอ่าน QR Code หรือข้อความบนสลิปได้อัตโนมัติ",
          rawPayload: null,
        };
      }
    }

    // 8. บันทึกลงฐานข้อมูล MongoDB
    const donation = new Donation({
      streamerId: streamer._id,
      donorName: safeDonorName,
      amount,
      message: safeMessage,
      paymentMethod,
      status: initialStatus,
      slipImage: safeSlipImage,
      transRef: safeTransRef,
      ocrResult,
    });

    await donation.save();

    // 9. Real-time Notification ผ่าน Socket.IO
    if (req.io) {
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

      req.io.to(`streamer_${streamer._id}`).emit("donation-alert", alertPayload);
      req.io.to(String(streamer._id)).emit("donation-alert", alertPayload);
      if (streamer.username) {
        req.io.to(`streamer_${streamer.username}`).emit("donation-alert", alertPayload);
        req.io.to(String(streamer.username)).emit("donation-alert", alertPayload);
      }
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

    // 1. ผลรวมยอดเงินและจำนวนครั้งที่ได้รับการสนับสนุน (สถานะ approved)
    const summaryAgg = await Donation.aggregate([
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
    ]);

    const totalAmount = summaryAgg[0]?.totalAmount || 0;
    const totalDonations = summaryAgg[0]?.totalDonations || 0;

    // 2. จำนวนรายการที่รอตรวจสอบ
    const pendingCount = await Donation.countDocuments({
      streamerId: { $eq: streamerObjectId },
      status: { $eq: "pending" },
    });

    // 3. รายชื่อผู้สนับสนุนอันดับต้นๆ (Top Donors)
    const topDonorsAgg = await Donation.aggregate([
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
    ]);

    const topDonors = topDonorsAgg.map((item, index) => ({
      rank: index + 1,
      name: item._id || "ผู้ไม่ประสงค์ออกนาม",
      totalAmount: item.totalAmount,
      donationCount: item.donationCount,
      badge: DONOR_BADGES[index] || "SUPPORTER",
    }));

    // 4. สถิติสำหรับวาดกราฟ DonationChart (7D, 30D, ALL)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const daily7Agg = await Donation.aggregate([
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
    ]);

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

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const daily30Agg = await Donation.aggregate([
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
    ]);

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

    const currentYear = new Date().getFullYear();
    const monthlyAgg = await Donation.aggregate([
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
    ]);

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

    // 5. รายการบริจาคล่าสุด 5 รายการสำหรับ RealtimeFeed
    const recentDonations = await Donation.find({
      streamerId: { $eq: streamerObjectId },
    })
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      message: "ดึงข้อมูลสถิติสำเร็จ",
      data: {
        totalAmount,
        totalDonations,
        pendingCount,
        topDonors,
        chartData: {
          "7D": chart7D,
          "30D": chart30D,
          ALL: chartAll,
        },
        recentDonations,
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
      req.io.to(`streamer_${donation.streamerId}`).emit("donation-alert", donation);
      req.io.to(String(donation.streamerId)).emit("donation-alert", donation);
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
