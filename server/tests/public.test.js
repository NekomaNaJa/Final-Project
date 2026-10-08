import request from "supertest";
import { jest } from "@jest/globals";
import app from "../app.js";
import User from "../Models/User.js";

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
