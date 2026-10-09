import User from "../Models/User.js";
import Widget from "../Models/Widget.js";
import Donation from "../Models/Donation.js";

/**
 * ดึงข้อมูลสาธารณะของสตรีมเมอร์สำหรับหน้า Donor Page (GET /api/public/:username)
 * ปิดบังข้อมูลส่วนตัว (email, password, phone ฯลฯ) คืนเฉพาะข้อมูลที่จำเป็นต่อการแสดงผล
 */
export const getPublicStreamer = async (req, res, next) => {
  try {
    const { username } = req.params;

    // 1. ตรวจสอบชนิดข้อมูล
    if (typeof username !== "string" || !username.trim()) {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
        data: null,
      });
    }

    // 2. ตัดสาย taint
    const safeUsername = String(username).trim();

    // 3. ป้องกัน NoSQL Injection ด้วย $eq
    const user = await User.findOne({ username: { $eq: safeUsername } });

    if (!user) {
      return res.status(404).json({
        message: "ไม่พบสตรีมเมอร์นี้",
        data: null,
      });
    }

    const publicData = {
      username: user.username,
      nickname: user.nickname || "",
      avatar: user.avatar || "",
      bio: user.bio || "",
      isLive: Boolean(user.isLive),
      social: {
        facebook: user.social?.facebook || "",
        instagram: user.social?.instagram || "",
        youtube: user.social?.youtube || "",
        tiktok: user.social?.tiktok || "",
        twitch: user.social?.twitch || "",
        x: user.social?.x || "",
      },
      donationPage: {
        welcomeMessage: user.donationPage?.welcomeMessage || "",
        thankYouMessage: user.donationPage?.thankYouMessage || "",
        minAmount:
          typeof user.donationPage?.minAmount === "number"
            ? user.donationPage.minAmount
            : 10,
        charLimit:
          typeof user.donationPage?.charLimit === "number"
            ? user.donationPage.charLimit
            : 100,
        disableFilter: Boolean(user.donationPage?.disableFilter),
        filteredWords: Array.isArray(user.donationPage?.filteredWords)
          ? user.donationPage.filteredWords
          : [],
        coverImage: user.donationPage?.coverImage || null,
        backgroundImage: user.donationPage?.backgroundImage || null,
      },
      payment: {
        promptpay: {
          enabled: Boolean(user.payment?.promptpay?.enabled),
          type: user.payment?.promptpay?.type || null,
          number: user.payment?.promptpay?.enabled
            ? user.payment?.promptpay?.number || ""
            : "",
        },
        bank: {
          enabled: Boolean(user.payment?.bank?.enabled),
          bankName: user.payment?.bank?.enabled
            ? user.payment?.bank?.bankName || null
            : null,
          accountNumber: user.payment?.bank?.enabled
            ? user.payment?.bank?.accountNumber || ""
            : "",
          accountName: user.payment?.bank?.enabled
            ? user.payment?.bank?.accountName || ""
            : "",
        },
        truemoney: {
          enabled: Boolean(user.payment?.truemoney?.enabled),
          phone: user.payment?.truemoney?.enabled
            ? user.payment?.truemoney?.phone || ""
            : "",
        },
      },
    };

    return res.status(200).json({
      message: "ดึงข้อมูลสตรีมเมอร์สำเร็จ",
      data: publicData,
    });
  } catch (err) {
    next(err);
  }
};

const DONOR_BADGES = ["MYTHIC", "ARCANE", "RUNE", "MANA", "ACOLYTE"];

/**
 * ดึงข้อมูลการแสดงผลวิดเจ็ตสำหรับ OBS Studio Browser Source (GET /api/public/overlay/:widgetType/:token)
 * รองรับ widgetType: alert, goal, leaderboard, mission, all
 * ดึงการตั้งค่าด้วย token หรือ username พร้อมคำนวณ Goal / Leaderboard จาก Donation Aggregation
 */
export const getPublicOverlayConfig = async (req, res, next) => {
  try {
    const { widgetType, token } = req.params;

    if (
      typeof widgetType !== "string" ||
      !widgetType.trim() ||
      typeof token !== "string" ||
      !token.trim()
    ) {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
        data: null,
      });
    }

    const safeType = String(widgetType).trim().toLowerCase();
    const safeToken = String(token).trim();

    // 1. ค้นหา Widget จาก token ก่อน
    let widget = await Widget.findOne({ token: { $eq: safeToken } });
    let streamer = null;

    if (widget) {
      streamer = await User.findById(widget.userId);
    } else {
      // หากไม่พบด้วย token ให้ลองค้นหาด้วย username ของสตรีมเมอร์เป็น fallback
      streamer = await User.findOne({ username: { $eq: safeToken } });
      if (streamer) {
        widget = await Widget.findOne({ userId: { $eq: streamer._id } });
        if (!widget) {
          widget = new Widget({ userId: streamer._id });
          await widget.save();
        }
      }
    }

    if (!widget || !streamer) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลวิดเจ็ตนี้",
        data: null,
      });
    }

    // 2. คำนวณยอดสะสมของ Goal จาก Donation Aggregation (เฉพาะสถานะ approved)
    const goalFilter = {
      streamerId: streamer._id,
      status: "approved",
    };

    if (widget.goal?.startDate) {
      const start = new Date(widget.goal.startDate);
      if (!Number.isNaN(start.getTime())) {
        goalFilter.createdAt = { ...goalFilter.createdAt, $gte: start };
      }
    }

    if (widget.goal?.endDate) {
      const end = new Date(widget.goal.endDate);
      if (!Number.isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        goalFilter.createdAt = { ...goalFilter.createdAt, $lte: end };
      }
    }

    const goalAgg = await Donation.aggregate([
      { $match: goalFilter },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const goalCurrent = goalAgg[0]?.total || 0;
    const goalData = {
      ...widget.goal.toObject(),
      current: goalCurrent,
    };

    // 3. คำนวณอันดับของ Leaderboard จาก Donation Aggregation
    const leaderboardFilter = {
      streamerId: streamer._id,
      status: "approved",
    };

    if (widget.leaderboard?.startDate) {
      const start = new Date(widget.leaderboard.startDate);
      if (!Number.isNaN(start.getTime())) {
        leaderboardFilter.createdAt = {
          ...leaderboardFilter.createdAt,
          $gte: start,
        };
      }
    }

    if (widget.leaderboard?.endDate) {
      const end = new Date(widget.leaderboard.endDate);
      if (!Number.isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        leaderboardFilter.createdAt = {
          ...leaderboardFilter.createdAt,
          $lte: end,
        };
      }
    }

    const limit = Math.max(1, Math.min(20, Number(widget.leaderboard?.limit) || 5));
    const leaderboardAgg = await Donation.aggregate([
      { $match: leaderboardFilter },
      {
        $group: {
          _id: "$donorName",
          totalAmount: { $sum: "$amount" },
          donationCount: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: limit },
    ]);

    const donors = leaderboardAgg.map((item, index) => ({
      rank: index + 1,
      name: item._id || "ผู้ไม่ประสงค์ออกนาม",
      amount: item.totalAmount,
      totalAmount: item.totalAmount,
      donationCount: item.donationCount,
      badge: DONOR_BADGES[index] || "SUPPORTER",
    }));

    const leaderboardData = {
      ...widget.leaderboard.toObject(),
      donors,
    };

    const streamerData = {
      id: streamer._id,
      username: streamer.username,
      nickname: streamer.nickname || streamer.username,
      avatar: streamer.avatar || "",
    };

    return res.status(200).json({
      message: "ดึงข้อมูลการแสดงผลวิดเจ็ตสำเร็จ",
      data: {
        type: safeType,
        token: widget.token,
        streamer: streamerData,
        alert: widget.alert,
        goal: goalData,
        leaderboard: leaderboardData,
        mission: widget.mission,
      },
    });
  } catch (err) {
    next(err);
  }
};

