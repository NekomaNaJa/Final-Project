import request from "supertest";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import app from "../app.js";
import User from "../Models/User.js";
import Otp from "../Models/Otp.js";
import { getJwtSecret } from "../utils/jwtSecret.js";

describe("Users Route", () => {
  const secret = getJwtSecret();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/users/me", () => {
    it("should return 401 when Authorization header is missing", async () => {
      const res = await request(app).get("/api/users/me");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ");
      expect(res.body.data).toBeNull();
    });

    it("should return 401 when Authorization header does not start with Bearer", async () => {
      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", "Basic somecredentials");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ");
    });

    it("should return 401 when token is invalid", async () => {
      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", "Bearer invalid-token");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token ไม่ถูกต้องหรือหมดอายุ");
    });

    it("should return 404 when token is valid but user not found in database", async () => {
      const token = jwt.sign({ userId: "mockId123", username: "user" }, secret);

      jest.spyOn(User, "findById").mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(null),
      });

      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("ไม่พบผู้ใช้");
      expect(res.body.data).toBeNull();
    });

    it("should return 200 with user data when token is valid and user exists", async () => {
      const token = jwt.sign({ userId: "mockId123", username: "validuser" }, secret);

      jest.spyOn(User, "findById").mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce({
          _id: "mockId123",
          username: "validuser",
          email: "valid@example.com",
        }),
      });

      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("ดึงข้อมูลผู้ใช้สำเร็จ");
      expect(res.body.data.username).toBe("validuser");
    });

    it("should forward server errors to errorHandler", async () => {
      const token = jwt.sign({ userId: "mockId123", username: "validuser" }, secret);

      jest.spyOn(User, "findById").mockReturnValueOnce({
        select: jest.fn().mockRejectedValueOnce(new Error("DB error")),
      });

      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่");
    });
  });

  describe("PUT /api/users/me", () => {
    it("should return 401 when Authorization header is missing", async () => {
      const res = await request(app).put("/api/users/me").send({ nickname: "Pro" });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ");
    });

    it("should return 404 when user is not found", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce(null);

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ nickname: "Pro" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("ไม่พบผู้ใช้");
    });

    it("should return 400 when string fields have invalid type", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce({
        _id: "mockId123",
      });

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ nickname: 12345 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ข้อมูล nickname ไม่ถูกต้อง");
    });

    it("should return 400 when gender is not in enum", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce({
        _id: "mockId123",
      });

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ gender: "alien" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("เพศไม่ถูกต้อง");
    });

    it("should return 400 when birthDate is invalid format", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce({
        _id: "mockId123",
      });

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ birthDate: "invalid-date-string" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("รูปแบบวันเกิดไม่ถูกต้อง");
    });

    it("should return 400 when social object is invalid", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce({
        _id: "mockId123",
      });

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ social: "not-an-object" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ข้อมูลโซเชียลมีเดียไม่ถูกต้อง");
    });

    it("should return 400 when social platform value is not a string", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce({
        _id: "mockId123",
      });

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ social: { facebook: 999 } });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ข้อมูลโซเชียล facebook ไม่ถูกต้อง");
    });

    it("should return 400 when password fields have invalid type", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce({
        _id: "mockId123",
      });

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: 1234 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ข้อมูลรหัสผ่านไม่ถูกต้อง");
    });

    it("should return 400 when currentPassword does not match existing password", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      const hashedPassword = await bcrypt.hash("OldPass123!", 10);
      jest.spyOn(User, "findById").mockResolvedValueOnce({
        _id: "mockId123",
        password: hashedPassword,
      });

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "WrongPass123!", newPassword: "NewValidPass123!" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("รหัสผ่านปัจจุบันไม่ถูกต้อง");
    });

    it("should return 400 when newPassword does not satisfy password validation", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      const hashedPassword = await bcrypt.hash("OldPass123!", 10);
      jest.spyOn(User, "findById").mockResolvedValueOnce({
        _id: "mockId123",
        password: hashedPassword,
      });

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "OldPass123!", newPassword: "weak" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("รหัสผ่านต้อง");
    });

    it("should successfully update profile fields, social links, and nullify birthDate", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      const mockDoc = {
        _id: "mockId123",
        username: "testuser",
        nickname: "OldNick",
        bio: "OldBio",
        gender: "",
        birthDate: new Date(),
        social: {},
        save: jest.fn().mockResolvedValue(true),
        toObject: function () {
          return { ...this };
        },
      };

      jest.spyOn(User, "findById").mockResolvedValueOnce(mockDoc);

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          nickname: "NewNick",
          fullName: "Somchai Jaidee",
          gender: "male",
          birthDate: null,
          bio: "Hello world",
          social: {
            facebook: "https://facebook.com/newnick",
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("อัปเดตข้อมูลผู้ใช้สำเร็จ");
      expect(mockDoc.nickname).toBe("NewNick");
      expect(mockDoc.fullName).toBe("Somchai Jaidee");
      expect(mockDoc.gender).toBe("male");
      expect(mockDoc.birthDate).toBeNull();
      expect(mockDoc.bio).toBe("Hello world");
      expect(mockDoc.social.facebook).toBe("https://facebook.com/newnick");
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it("should successfully update password when valid", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      const hashedPassword = await bcrypt.hash("OldPass123!", 10);
      const mockDoc = {
        _id: "mockId123",
        password: hashedPassword,
        save: jest.fn().mockResolvedValue(true),
        toObject: function () {
          return { ...this };
        },
      };

      jest.spyOn(User, "findById").mockResolvedValueOnce(mockDoc);

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "OldPass123!",
          newPassword: "NewValidPassword123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("อัปเดตข้อมูลผู้ใช้สำเร็จ");
      expect(mockDoc.password).not.toBe(hashedPassword);
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it("should allow setting password when user has no existing password, and empty birthDate", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      const mockDoc = {
        _id: "mockId123",
        password: null,
        social: null,
        save: jest.fn().mockResolvedValue(true),
        toObject: function () {
          return { ...this };
        },
      };

      jest.spyOn(User, "findById").mockResolvedValueOnce(mockDoc);

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          birthDate: "",
          social: { youtube: "https://youtube.com/c/streamer" },
          currentPassword: "",
          newPassword: "NewValidPassword123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("อัปเดตข้อมูลผู้ใช้สำเร็จ");
      expect(mockDoc.birthDate).toBeNull();
      expect(mockDoc.social.youtube).toBe("https://youtube.com/c/streamer");
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it("should forward server errors to errorHandler on exception", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockRejectedValueOnce(new Error("Database failure"));

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ nickname: "Fail" });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่");
    });
  });

  describe("PUT /api/users/payment", () => {
    it("should return 401 when Authorization header is missing", async () => {
      const res = await request(app).put("/api/users/payment").send({ promptpay: { enabled: true } });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ");
    });

    it("should return 404 when user is not found", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce(null);

      const res = await request(app)
        .put("/api/users/payment")
        .set("Authorization", `Bearer ${token}`)
        .send({ promptpay: { enabled: true } });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("ไม่พบผู้ใช้");
    });

    it("should return 400 when promptpay is not an object", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/payment")
        .set("Authorization", `Bearer ${token}`)
        .send({ promptpay: "invalid" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ข้อมูลพร้อมเพย์ไม่ถูกต้อง");
    });

    it("should return 400 when promptpay.type is invalid", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/payment")
        .set("Authorization", `Bearer ${token}`)
        .send({ promptpay: { type: "InvalidType" } });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ประเภทพร้อมเพย์ไม่ถูกต้อง");
    });

    it("should return 400 when promptpay.number is not a string", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/payment")
        .set("Authorization", `Bearer ${token}`)
        .send({ promptpay: { number: 12345 } });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("หมายเลขพร้อมเพย์ต้องเป็นข้อความ");
    });

    it("should return 400 when bank is not an object", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/payment")
        .set("Authorization", `Bearer ${token}`)
        .send({ bank: "invalid" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ข้อมูลธนาคารไม่ถูกต้อง");
    });

    it("should return 400 when bank.bankName is invalid", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/payment")
        .set("Authorization", `Bearer ${token}`)
        .send({ bank: { bankName: "Unknown Bank" } });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ชื่อธนาคารไม่ถูกต้อง");
    });

    it("should return 400 when bank.accountNumber is not a string", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/payment")
        .set("Authorization", `Bearer ${token}`)
        .send({ bank: { accountNumber: 12345 } });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("เลขบัญชีธนาคารต้องเป็นข้อความ");
    });

    it("should return 400 when bank.accountName is not a string", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/payment")
        .set("Authorization", `Bearer ${token}`)
        .send({ bank: { accountName: 12345 } });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ชื่อบัญชีธนาคารต้องเป็นข้อความ");
    });

    it("should return 400 when truemoney is not an object", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/payment")
        .set("Authorization", `Bearer ${token}`)
        .send({ truemoney: "invalid" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ข้อมูลทรูมันนี่ไม่ถูกต้อง");
    });

    it("should return 400 when truemoney.phone is not a string", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/payment")
        .set("Authorization", `Bearer ${token}`)
        .send({ truemoney: { phone: 12345 } });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("เบอร์โทรศัพท์ทรูมันนี่ต้องเป็นข้อความ");
    });

    it("should update payment channels successfully and preserve unset channels", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      const mockDoc = {
        _id: "mockId123",
        payment: {
          promptpay: { enabled: false, type: "เบอร์โทรศัพท์", number: "0811111111" },
          bank: { enabled: false, bankName: null, accountNumber: "", accountName: "" },
          truemoney: { enabled: false, phone: "" },
        },
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(User, "findById").mockResolvedValueOnce(mockDoc);

      const res = await request(app)
        .put("/api/users/payment")
        .set("Authorization", `Bearer ${token}`)
        .send({
          promptpay: { enabled: true, type: "e-Wallet ID", number: "1400012345678" },
          bank: {
            enabled: true,
            bankName: "ธนาคารไทยพาณิชย์ (SCB)",
            accountNumber: "123-4-56789-0",
            accountName: "นาย สมชาย สายบุญ",
          },
          truemoney: { enabled: true, phone: "0898765432" },
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("อัปเดตช่องทางรับเงินสำเร็จ");
      expect(res.body.data.promptpay.enabled).toBe(true);
      expect(res.body.data.promptpay.type).toBe("e-Wallet ID");
      expect(res.body.data.bank.bankName).toBe("ธนาคารไทยพาณิชย์ (SCB)");
      expect(res.body.data.truemoney.phone).toBe("0898765432");
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it("should forward server error to errorHandler on database failure", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockRejectedValueOnce(new Error("Database failure"));

      const res = await request(app)
        .put("/api/users/payment")
        .set("Authorization", `Bearer ${token}`)
        .send({ promptpay: { enabled: true } });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่");
    });
  });

  describe("PUT /api/users/donation-page", () => {
    it("should return 401 when token is missing", async () => {
      const res = await request(app)
        .put("/api/users/donation-page")
        .send({ welcomeMessage: "ยินดีต้อนรับ" });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ");
    });

    it("should return 401 when token is invalid", async () => {
      const res = await request(app)
        .put("/api/users/donation-page")
        .set("Authorization", "Bearer invalid-token")
        .send({ welcomeMessage: "ยินดีต้อนรับ" });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token ไม่ถูกต้องหรือหมดอายุ");
    });

    it("should return 404 when user is not found", async () => {
      const token = jwt.sign({ userId: "mockId999" }, secret);
      jest.spyOn(User, "findOne").mockResolvedValueOnce(null);

      const res = await request(app)
        .put("/api/users/donation-page")
        .set("Authorization", `Bearer ${token}`)
        .send({ welcomeMessage: "ยินดีต้อนรับ" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("ไม่พบผู้ใช้");
    });

    it("should return 400 when welcomeMessage is not a string", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findOne").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/donation-page")
        .set("Authorization", `Bearer ${token}`)
        .send({ welcomeMessage: 12345 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ข้อความต้อนรับไม่ถูกต้อง");
    });

    it("should return 400 when thankYouMessage is not a string", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findOne").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/donation-page")
        .set("Authorization", `Bearer ${token}`)
        .send({ thankYouMessage: 12345 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ข้อความขอบคุณไม่ถูกต้อง");
    });

    it("should return 400 when minAmount is invalid", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findOne").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/donation-page")
        .set("Authorization", `Bearer ${token}`)
        .send({ minAmount: -5 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("จำนวนเงินขั้นต่ำไม่ถูกต้อง");
    });

    it("should return 400 when charLimit is negative", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findOne").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/donation-page")
        .set("Authorization", `Bearer ${token}`)
        .send({ charLimit: -10 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("จำนวนจำกัดตัวอักษรไม่ถูกต้อง");
    });

    it("should return 400 when disableFilter is not boolean", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findOne").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/donation-page")
        .set("Authorization", `Bearer ${token}`)
        .send({ disableFilter: "false" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ค่าตัวกรองข้อความไม่ถูกต้อง");
    });

    it("should return 400 when filteredWords is not an array", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findOne").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/donation-page")
        .set("Authorization", `Bearer ${token}`)
        .send({ filteredWords: "badwords" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("รายการคำที่กรองไม่ถูกต้อง");
    });

    it("should return 400 when filteredWords contains non-string items", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findOne").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/donation-page")
        .set("Authorization", `Bearer ${token}`)
        .send({ filteredWords: ["word1", 123] });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("คำที่กรองต้องเป็นข้อความ");
    });

    it("should return 400 when coverImage is invalid", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findOne").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/donation-page")
        .set("Authorization", `Bearer ${token}`)
        .send({ coverImage: 123 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("รูปภาพหน้าปกไม่ถูกต้อง");
    });

    it("should return 400 when backgroundImage is invalid", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findOne").mockResolvedValueOnce({ _id: "mockId123" });

      const res = await request(app)
        .put("/api/users/donation-page")
        .set("Authorization", `Bearer ${token}`)
        .send({ backgroundImage: 123 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("รูปภาพพื้นหลังไม่ถูกต้อง");
    });

    it("should update donationPage fields successfully and handle unlimited charLimit", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      const mockDoc = {
        _id: "mockId123",
        donationPage: {
          welcomeMessage: "",
          thankYouMessage: "",
          minAmount: 10,
          charLimit: 100,
          disableFilter: false,
          filteredWords: [],
          coverImage: null,
          backgroundImage: null,
        },
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(User, "findOne").mockResolvedValueOnce(mockDoc);

      const res = await request(app)
        .put("/api/users/donation-page")
        .set("Authorization", `Bearer ${token}`)
        .send({
          donationPage: {
            welcomeMessage: "ยินดีต้อนรับสู่ห้องสตรีม",
            thankYouMessage: "ขอบคุณสำหรับการสนับสนุน!",
            minAmount: 20,
            charLimit: "unlimited",
            disableFilter: true,
            filteredWords: ["หยาบ1", "หยาบ2"],
            coverImage: "https://example.com/cover.png",
            backgroundImage: "https://example.com/bg.png",
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("อัปเดตการตั้งค่าหน้ารับเงินสำเร็จ");
      expect(res.body.data.welcomeMessage).toBe("ยินดีต้อนรับสู่ห้องสตรีม");
      expect(res.body.data.thankYouMessage).toBe("ขอบคุณสำหรับการสนับสนุน!");
      expect(res.body.data.minAmount).toBe(20);
      expect(res.body.data.charLimit).toBe(0);
      expect(res.body.data.disableFilter).toBe(true);
      expect(res.body.data.filteredWords).toEqual(["หยาบ1", "หยาบ2"]);
      expect(res.body.data.coverImage).toBe("https://example.com/cover.png");
      expect(res.body.data.backgroundImage).toBe("https://example.com/bg.png");
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it("should update autoApproveSlip setting when provided", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      const mockDoc = {
        donationPage: {
          autoApproveSlip: true,
        },
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(User, "findOne").mockResolvedValueOnce(mockDoc);

      const res = await request(app)
        .put("/api/users/donation-page")
        .set("Authorization", `Bearer ${token}`)
        .send({
          autoApproveSlip: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("อัปเดตการตั้งค่าหน้ารับเงินสำเร็จ");
      expect(res.body.data.autoApproveSlip).toBe(false);
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it("should forward server error to errorHandler on database failure", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findOne").mockRejectedValueOnce(new Error("Database failure"));

      const res = await request(app)
        .put("/api/users/donation-page")
        .set("Authorization", `Bearer ${token}`)
        .send({ welcomeMessage: "ข้อความต้อนรับ" });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่");
    });
  });

  describe("PUT /api/users/me (isLive field)", () => {
    it("should return 400 when isLive is not a boolean", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      const mockDoc = { isLive: false, save: jest.fn() };
      jest.spyOn(User, "findById").mockResolvedValueOnce(mockDoc);

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ isLive: "true" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ข้อมูลสถานะเปิดรับเงินไม่ถูกต้อง");
    });

    it("should update isLive successfully", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      const mockDoc = { isLive: false, save: jest.fn().mockResolvedValue(true) };
      jest.spyOn(User, "findById").mockResolvedValueOnce(mockDoc);

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ isLive: true });

      expect(res.status).toBe(200);
      expect(mockDoc.isLive).toBe(true);
      expect(mockDoc.save).toHaveBeenCalled();
    });
  });

  describe("PUT /api/users/change-password", () => {
    it("should return 401 when Authorization header is missing", async () => {
      const res = await request(app)
        .put("/api/users/change-password")
        .send({ currentPassword: "OldPassword1!", newPassword: "NewPassword1!" });

      expect(res.status).toBe(401);
    });

    it("should return 400 when password fields are invalid types", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      const mockDoc = { password: "hashed", save: jest.fn() };
      jest.spyOn(User, "findById").mockResolvedValueOnce(mockDoc);

      const res = await request(app)
        .put("/api/users/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: 123, newPassword: "NewPassword1!" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ข้อมูลรหัสผ่านไม่ถูกต้อง");
    });

    it("should return 400 when current password is wrong", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      const mockDoc = { password: "hashedPassword", save: jest.fn() };
      jest.spyOn(User, "findById").mockResolvedValueOnce(mockDoc);
      jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(false);

      const res = await request(app)
        .put("/api/users/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "WrongPassword1!", newPassword: "NewPassword1!" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("รหัสผ่านปัจจุบันไม่ถูกต้อง");
    });

    it("should return 400 when new password is weak", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      const mockDoc = { password: "hashedPassword", save: jest.fn() };
      jest.spyOn(User, "findById").mockResolvedValueOnce(mockDoc);
      jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(true);

      const res = await request(app)
        .put("/api/users/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "CorrectPassword1!", newPassword: "weak" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("รหัสผ่าน");
    });

    it("should return 200 and hash new password when valid", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      const mockDoc = { password: "hashedPassword", save: jest.fn().mockResolvedValue(true) };
      jest.spyOn(User, "findById").mockResolvedValueOnce(mockDoc);
      jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(true);
      jest.spyOn(bcrypt, "hash").mockResolvedValueOnce("newHashedPassword");

      const res = await request(app)
        .put("/api/users/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "OldPassword1!", newPassword: "NewPassword1!" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("เปลี่ยนรหัสผ่านสำเร็จ");
      expect(mockDoc.password).toBe("newHashedPassword");
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it("should return 404 when user not found in database", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce(null);

      const res = await request(app)
        .put("/api/users/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "OldPassword1!", newPassword: "NewPassword1!" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("ไม่พบผู้ใช้");
    });

    it("should change password when valid OTP is provided instead of currentPassword", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      const mockDoc = {
        _id: "mockId123",
        email: "user@example.com",
        password: "oldHashedPassword",
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(User, "findById").mockResolvedValueOnce(mockDoc);
      jest.spyOn(Otp, "findOne").mockResolvedValueOnce({
        _id: "otp99",
        email: "user@example.com",
        otpCode: "123456",
        expiresAt: new Date(Date.now() + 60000),
      });
      jest.spyOn(Otp, "deleteOne").mockResolvedValueOnce({});
      jest.spyOn(bcrypt, "hash").mockResolvedValueOnce("newOtpHashedPassword");

      const res = await request(app)
        .put("/api/users/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ otp: "123456", newPassword: "NewPassword1!" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("เปลี่ยนรหัสผ่านสำเร็จ");
      expect(mockDoc.password).toBe("newOtpHashedPassword");
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it("should return 400 when OTP provided to change-password is invalid", async () => {
      const token = jwt.sign({ userId: "mockId123" }, secret);
      jest.spyOn(User, "findById").mockResolvedValueOnce({
        _id: "mockId123",
        email: "user@example.com",
      });
      jest.spyOn(Otp, "findOne").mockResolvedValueOnce({
        _id: "otp99",
        email: "user@example.com",
        otpCode: "123456",
        expiresAt: new Date(Date.now() + 60000),
      });

      const res = await request(app)
        .put("/api/users/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ otp: "999999", newPassword: "NewPassword1!" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("รหัส OTP ไม่ถูกต้อง");
    });
  });

  describe("Link OTP Flow (Email & Phone Linking)", () => {
    describe("POST /api/users/link-otp/send", () => {
      it("should return 401 when token is missing", async () => {
        const res = await request(app)
          .post("/api/users/link-otp/send")
          .send({ target: "new@example.com", type: "email" });

        expect(res.status).toBe(401);
      });

      it("should return 400 when target or type is invalid", async () => {
        const token = jwt.sign({ userId: "mockId123" }, secret);
        jest.spyOn(User, "findById").mockResolvedValueOnce({ _id: "mockId123" });

        const res = await request(app)
          .post("/api/users/link-otp/send")
          .set("Authorization", `Bearer ${token}`)
          .send({ target: 12345, type: "email" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("ข้อมูลไม่ถูกต้อง");
      });

      it("should return 400 when email format is invalid", async () => {
        const token = jwt.sign({ userId: "mockId123" }, secret);
        jest.spyOn(User, "findById").mockResolvedValueOnce({ _id: "mockId123" });

        const res = await request(app)
          .post("/api/users/link-otp/send")
          .set("Authorization", `Bearer ${token}`)
          .send({ target: "not-an-email", type: "email" });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("รูปแบบอีเมลไม่ถูกต้อง");
      });

      it("should return 400 when email is already taken by another user", async () => {
        const token = jwt.sign({ userId: "mockId123" }, secret);
        jest.spyOn(User, "findById").mockResolvedValueOnce({ _id: "mockId123" });
        jest.spyOn(User, "findOne").mockResolvedValueOnce({ _id: "otherUser456" });

        const res = await request(app)
          .post("/api/users/link-otp/send")
          .set("Authorization", `Bearer ${token}`)
          .send({ target: "taken@example.com", type: "email" });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("อีเมลนี้ถูกใช้งานโดยบัญชีอื่นแล้ว");
      });

      it("should return 400 when phone format is invalid", async () => {
        const token = jwt.sign({ userId: "mockId123" }, secret);
        jest.spyOn(User, "findById").mockResolvedValueOnce({ _id: "mockId123" });

        const res = await request(app)
          .post("/api/users/link-otp/send")
          .set("Authorization", `Bearer ${token}`)
          .send({ target: "123", type: "phone" });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง");
      });

      it("should return 503 when email provider is not configured", async () => {
        const token = jwt.sign({ userId: "mockId123" }, secret);
        jest.spyOn(User, "findById").mockResolvedValueOnce({ _id: "mockId123" });
        jest.spyOn(User, "findOne").mockResolvedValueOnce(null);
        jest.spyOn(Otp, "deleteMany").mockResolvedValue({});
        jest.spyOn(Otp, "create").mockResolvedValueOnce({});

        const res = await request(app)
          .post("/api/users/link-otp/send")
          .set("Authorization", `Bearer ${token}`)
          .send({ target: "myemail@example.com", type: "email" });

        expect(res.status).toBe(503);
        expect(res.body.message).toContain("ระบบส่งอีเมลยังไม่ได้ตั้งค่า");
      });

      it("should successfully send OTP for phone linking", async () => {
        const token = jwt.sign({ userId: "mockId123" }, secret);
        jest.spyOn(User, "findById").mockResolvedValueOnce({ _id: "mockId123" });
        jest.spyOn(User, "findOne").mockResolvedValueOnce(null);
        jest.spyOn(Otp, "deleteMany").mockResolvedValueOnce({});
        jest.spyOn(Otp, "create").mockResolvedValueOnce({});

        const res = await request(app)
          .post("/api/users/link-otp/send")
          .set("Authorization", `Bearer ${token}`)
          .send({ target: "0812345678", type: "phone" });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain("ส่งรหัส OTP ไปยัง");
        expect(res.body.data.target).toBe("0812345678");
      });
    });

    describe("POST /api/users/link-otp/verify", () => {
      it("should return 400 when OTP record is not found", async () => {
        const token = jwt.sign({ userId: "mockId123" }, secret);
        jest.spyOn(User, "findById").mockResolvedValueOnce({ _id: "mockId123" });
        jest.spyOn(Otp, "findOne").mockResolvedValueOnce(null);

        const res = await request(app)
          .post("/api/users/link-otp/verify")
          .set("Authorization", `Bearer ${token}`)
          .send({ target: "myemail@example.com", type: "email", otp: "123456" });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("รหัส OTP หมดอายุหรือไม่มีอยู่ในระบบ");
      });

      it("should return 400 when OTP is incorrect", async () => {
        const token = jwt.sign({ userId: "mockId123" }, secret);
        jest.spyOn(User, "findById").mockResolvedValueOnce({ _id: "mockId123" });
        const mockOtp = {
          _id: "otp1",
          otp: "123456",
          expiresAt: new Date(Date.now() + 60000),
          attempts: 0,
          save: jest.fn().mockResolvedValue(true),
        };
        jest.spyOn(Otp, "findOne").mockResolvedValueOnce(mockOtp);

        const res = await request(app)
          .post("/api/users/link-otp/verify")
          .set("Authorization", `Bearer ${token}`)
          .send({ target: "myemail@example.com", type: "email", otp: "999999" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("รหัส OTP ไม่ถูกต้อง");
        expect(mockOtp.attempts).toBe(1);
      });

      it("should successfully verify and link email", async () => {
        const token = jwt.sign({ userId: "mockId123" }, secret);
        const mockUser = {
          _id: "mockId123",
          email: "old@example.com",
          isEmailVerified: false,
          save: jest.fn().mockResolvedValue(true),
        };
        jest.spyOn(User, "findById")
          .mockResolvedValueOnce(mockUser)
          .mockReturnValueOnce({
            select: jest.fn().mockResolvedValueOnce({
              _id: "mockId123",
              email: "new@example.com",
              isEmailVerified: true,
            }),
          });

        jest.spyOn(Otp, "findOne").mockResolvedValueOnce({
          _id: "otp1",
          otp: "123456",
          expiresAt: new Date(Date.now() + 60000),
          attempts: 0,
        });
        jest.spyOn(Otp, "deleteOne").mockResolvedValueOnce({});

        const res = await request(app)
          .post("/api/users/link-otp/verify")
          .set("Authorization", `Bearer ${token}`)
          .send({ target: "new@example.com", type: "email", otp: "123456" });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("เชื่อมต่อและยืนยันอีเมลสำเร็จ");
        expect(mockUser.email).toBe("new@example.com");
        expect(mockUser.isEmailVerified).toBe(true);
      });

      it("should successfully verify and link phone", async () => {
        const token = jwt.sign({ userId: "mockId123" }, secret);
        const mockUser = {
          _id: "mockId123",
          phone: "",
          isPhoneVerified: false,
          save: jest.fn().mockResolvedValue(true),
        };
        jest.spyOn(User, "findById")
          .mockResolvedValueOnce(mockUser)
          .mockReturnValueOnce({
            select: jest.fn().mockResolvedValueOnce({
              _id: "mockId123",
              phone: "0812345678",
              isPhoneVerified: true,
            }),
          });

        jest.spyOn(Otp, "findOne").mockResolvedValueOnce({
          _id: "otp1",
          otp: "654321",
          expiresAt: new Date(Date.now() + 60000),
          attempts: 0,
        });
        jest.spyOn(Otp, "deleteOne").mockResolvedValueOnce({});

        const res = await request(app)
          .post("/api/users/link-otp/verify")
          .set("Authorization", `Bearer ${token}`)
          .send({ target: "0812345678", type: "phone", otp: "654321" });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("เชื่อมต่อและยืนยันเบอร์โทรศัพท์สำเร็จ");
        expect(mockUser.phone).toBe("0812345678");
        expect(mockUser.isPhoneVerified).toBe(true);
      });
    });
  });
});



