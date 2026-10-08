import User from "../Models/User.js";

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
