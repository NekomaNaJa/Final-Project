import request from "supertest";
import { jest } from "@jest/globals";
import app from "../app.js";
import User from "../Models/User.js";
import Widget from "../Models/Widget.js";
import Donation from "../Models/Donation.js";

describe("Public Route (GET /api/public/:username)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if username is empty or spaces", async () => {
    const res = await request(app).get("/api/public/%20");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("ข้อมูลไม่ถูกต้อง");
    expect(res.body.data).toBeNull();
  });

  it("should return 404 if streamer is not found", async () => {
    jest.spyOn(User, "findOne").mockResolvedValueOnce(null);

    const res = await request(app).get("/api/public/unknown_streamer");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ไม่พบสตรีมเมอร์นี้");
    expect(res.body.data).toBeNull();
  });

  it("should return 200 and public streamer data without sensitive fields", async () => {
    const mockUser = {
      _id: "60c72b2f9b1d8b2bad876543",
      username: "streamerpro",
      email: "secret@streamer.com",
      password: "hashedpassword123",
      googleId: "google123456",
      phone: "0899999999",
      birthDate: new Date(),
      nickname: "Pro Streamer",
      avatar: "https://example.com/avatar.png",
      bio: "Hello world!",
      isLive: true,
      social: {
        facebook: "streamerpro.fb",
        youtube: "streamerpro.yt",
      },
      donationPage: {
        welcomeMessage: "ยินดีต้อนรับ",
        thankYouMessage: "ขอบคุณครับ",
        minAmount: 20,
        charLimit: 150,
        disableFilter: false,
        filteredWords: ["หยาบคาย"],
        coverImage: "https://example.com/cover.png",
        backgroundImage: null,
      },
      payment: {
        promptpay: {
          enabled: true,
          type: "เบอร์โทรศัพท์",
          number: "0812345678",
        },
        bank: {
          enabled: true,
          bankName: "ธนาคารไทยพาณิชย์ (SCB)",
          accountNumber: "1234567890",
          accountName: "นาย สมชาย",
        },
        truemoney: {
          enabled: false,
          phone: "0899999999",
        },
      },
    };

    jest.spyOn(User, "findOne").mockResolvedValueOnce(mockUser);

    const res = await request(app).get("/api/public/streamerpro");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("ดึงข้อมูลสตรีมเมอร์สำเร็จ");
    expect(res.body.data.username).toBe("streamerpro");
    expect(res.body.data.nickname).toBe("Pro Streamer");
    expect(res.body.data.avatar).toBe("https://example.com/avatar.png");
    expect(res.body.data.isLive).toBe(true);

    // Verify sensitive data is NOT returned
    expect(res.body.data.email).toBeUndefined();
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.googleId).toBeUndefined();
    expect(res.body.data.phone).toBeUndefined();

    // Verify payment channels
    expect(res.body.data.payment.promptpay.enabled).toBe(true);
    expect(res.body.data.payment.promptpay.number).toBe("0812345678");
    expect(res.body.data.payment.bank.enabled).toBe(true);
    expect(res.body.data.payment.bank.accountNumber).toBe("1234567890");
    expect(res.body.data.payment.truemoney.enabled).toBe(false);
    expect(res.body.data.payment.truemoney.phone).toBe("");
  });

  it("should handle default/empty optional fields gracefully", async () => {
    const minimalUser = {
      username: "minimal_streamer",
      isLive: false,
    };

    jest.spyOn(User, "findOne").mockResolvedValueOnce(minimalUser);

    const res = await request(app).get("/api/public/minimal_streamer");

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe("minimal_streamer");
    expect(res.body.data.nickname).toBe("");
    expect(res.body.data.donationPage.minAmount).toBe(10);
    expect(res.body.data.donationPage.charLimit).toBe(100);
    expect(res.body.data.payment.promptpay.enabled).toBe(false);
    expect(res.body.data.payment.bank.enabled).toBe(false);
    expect(res.body.data.payment.truemoney.enabled).toBe(false);
  });

  it("should handle server error", async () => {
    jest.spyOn(User, "findOne").mockRejectedValueOnce(new Error("DB failure"));

    const res = await request(app).get("/api/public/error_streamer");

    expect(res.status).toBe(500);
    expect(res.body.data).toBeNull();
  });
});

describe("Public Overlay Route (GET /api/public/overlay/:widgetType/:token)", () => {
  const mockUserId = "60c72b2f9b1d8b2bad876543";
  const mockUser = {
    _id: mockUserId,
    username: "streamerpro",
    nickname: "Pro Streamer",
    avatar: "https://example.com/avatar.png",
  };

  const mockWidget = {
    _id: "60c72b2f9b1d8b2bad876999",
    userId: mockUserId,
    token: "valid-widget-token-xyz",
    alert: {
      minAmount: 10,
      soundPreset: "mythic-horn",
    },
    goal: {
      title: "เป้าหมายพัฒนาสตรีม",
      target: 10000,
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      toObject: () => ({
        title: "เป้าหมายพัฒนาสตรีม",
        target: 10000,
        startDate: "2026-09-01",
        endDate: "2026-09-30",
      }),
    },
    leaderboard: {
      title: "TOP DONORS ประจำเดือน",
      limit: 5,
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      toObject: () => ({
        title: "TOP DONORS ประจำเดือน",
        limit: 5,
        startDate: "2026-09-01",
        endDate: "2026-09-30",
      }),
    },
    mission: {
      title: "ภารกิจโดเนท",
      missions: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if widgetType or token is empty/whitespace", async () => {
    const res = await request(app).get("/api/public/overlay/%20/%20");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("ข้อมูลไม่ถูกต้อง");
    expect(res.body.data).toBeNull();
  });

  it("should return 404 if neither widget token nor username matches", async () => {
    jest.spyOn(Widget, "findOne").mockResolvedValueOnce(null);
    jest.spyOn(User, "findOne").mockResolvedValueOnce(null);

    const res = await request(app).get("/api/public/overlay/alert/nonexistent-token");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ไม่พบข้อมูลวิดเจ็ตนี้");
    expect(res.body.data).toBeNull();
  });

  it("should return 200 and overlay config with aggregated goal & leaderboard", async () => {
    jest.spyOn(Widget, "findOne").mockResolvedValueOnce(mockWidget);
    jest.spyOn(User, "findById").mockResolvedValueOnce(mockUser);

    // Mock aggregation for goal & leaderboard
    jest
      .spyOn(Donation, "aggregate")
      .mockResolvedValueOnce([{ _id: null, total: 4500 }]) // Goal total
      .mockResolvedValueOnce([
        { _id: "TopDonor1", totalAmount: 3000, donationCount: 2 },
        { _id: "TopDonor2", totalAmount: 1500, donationCount: 1 },
      ]); // Leaderboard top donors

    const res = await request(app).get(
      "/api/public/overlay/goal/valid-widget-token-xyz"
    );

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("ดึงข้อมูลการแสดงผลวิดเจ็ตสำเร็จ");
    expect(res.body.data.token).toBe("valid-widget-token-xyz");
    expect(res.body.data.streamer.username).toBe("streamerpro");
    expect(res.body.data.goal.current).toBe(4500);
    expect(res.body.data.leaderboard.donors).toHaveLength(2);
    expect(res.body.data.leaderboard.donors[0].name).toBe("TopDonor1");
    expect(res.body.data.leaderboard.donors[0].amount).toBe(3000);
  });

  it("should fallback to finding by username if token not found", async () => {
    jest.spyOn(Widget, "findOne")
      .mockResolvedValueOnce(null) // token lookup
      .mockResolvedValueOnce(mockWidget); // username's widget lookup
    jest.spyOn(User, "findOne").mockResolvedValueOnce(mockUser);
    jest.spyOn(Donation, "aggregate")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await request(app).get("/api/public/overlay/alert/streamerpro");

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBe("valid-widget-token-xyz");
    expect(res.body.data.alert.soundPreset).toBe("mythic-horn");
  });

  it("should handle server error during overlay fetch", async () => {
    jest.spyOn(Widget, "findOne").mockRejectedValueOnce(new Error("Database crash"));

    const res = await request(app).get("/api/public/overlay/alert/some-token");

    expect(res.status).toBe(500);
    expect(res.body.data).toBeNull();
  });
});


