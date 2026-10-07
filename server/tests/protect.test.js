import request from "supertest";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import app from "../app.js";
import User from "../Models/User.js";

describe("Protect Middleware & Users Route", () => {
  const secret = process.env.JWT_SECRET || "donix_jwt_secret_dev";

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
});


