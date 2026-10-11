import request from "supertest";
import { jest } from "@jest/globals";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import app from "../app.js";
import User from "../Models/User.js";
import Otp from "../Models/Otp.js";
import { getJwtSecret } from "../utils/jwtSecret.js";

describe("Auth Controller & Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should return 400 if fields are missing or not strings", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ username: 123, email: "test@example.com", password: "Password1!" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ข้อมูลไม่ถูกต้อง");
      expect(res.body.data).toBeNull();
    });

    it("should return 400 if username is invalid (too short or special chars)", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ username: "ab", email: "test@example.com", password: "Password1!" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Username ต้องมีความยาว 3-30 ตัวอักษร");
    });

    it("should return 400 if email is invalid format", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ username: "validuser", email: "not-an-email", password: "Password1!" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("รูปแบบอีเมลไม่ถูกต้อง");
    });

    it("should return 400 if password does not meet requirements", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ username: "validuser", email: "test@example.com", password: "weak" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("รหัสผ่านต้อง");
    });

    it("should return 400 if email already exists", async () => {
      jest.spyOn(User, "findOne").mockResolvedValueOnce({ email: "test@example.com" });

      const res = await request(app)
        .post("/api/auth/register")
        .send({ username: "validuser", email: "test@example.com", password: "Password1!" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email นี้ถูกใช้งานแล้ว");
    });

    it("should return 400 if username already exists", async () => {
      jest.spyOn(User, "findOne")
        .mockResolvedValueOnce(null) // email not taken
        .mockResolvedValueOnce({ username: "validuser" }); // username taken

      const res = await request(app)
        .post("/api/auth/register")
        .send({ username: "validuser", email: "test@example.com", password: "Password1!" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Username นี้ถูกใช้งานแล้ว");
    });

    it("should register successfully and return 201 with token and user data", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null);
      jest.spyOn(User.prototype, "save").mockImplementation(function () {
        this._id = "mockUserId123";
        return Promise.resolve(this);
      });

      const res = await request(app)
        .post("/api/auth/register")
        .send({ username: "validuser", email: "test@example.com", password: "Password1!" });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("สมัครสมาชิกสำเร็จ");
      expect(res.body.token).toBeDefined();
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.username).toBe("validuser");
      expect(res.body.data.user.email).toBe("test@example.com");
    });

    it("should call next with error on database failure", async () => {
      jest.spyOn(User, "findOne").mockRejectedValueOnce(new Error("DB Error"));

      const res = await request(app)
        .post("/api/auth/register")
        .send({ username: "validuser", email: "test@example.com", password: "Password1!" });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should return 400 if email or password are not strings", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: 123, password: "Password1!" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ข้อมูลไม่ถูกต้อง");
    });

    it("should return 400 if user is not found or has no password", async () => {
      jest.spyOn(User, "findOne").mockResolvedValueOnce(null);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "Password1!" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email หรือรหัสผ่านไม่ถูกต้อง");
    });

    it("should return 400 if password does not match", async () => {
      jest.spyOn(User, "findOne").mockResolvedValueOnce({
        _id: "userId123",
        username: "validuser",
        email: "test@example.com",
        password: "hashedPassword",
      });
      jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(false);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "WrongPassword1!" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email หรือรหัสผ่านไม่ถูกต้อง");
    });

    it("should return 200 with token and user data on successful login", async () => {
      jest.spyOn(User, "findOne").mockResolvedValueOnce({
        _id: "userId123",
        username: "validuser",
        email: "test@example.com",
        password: "hashedPassword",
      });
      jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(true);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "Password1!" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("เข้าสู่ระบบสำเร็จ");
      expect(res.body.token).toBeDefined();
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.username).toBe("validuser");
    });

    it("should call next with error on server failure", async () => {
      jest.spyOn(User, "findOne").mockRejectedValueOnce(new Error("DB error"));

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "Password1!" });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่");
    });
  });

  describe("POST /api/auth/google", () => {
    it("should return 400 if no credential, accessToken or mockUser is provided", async () => {
      const res = await request(app)
        .post("/api/auth/google")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("กรุณาระบุ Google Credential");
    });

    it("should return 400 if Google tokeninfo fails", async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "invalid_token" }),
      });

      const res = await request(app)
        .post("/api/auth/google")
        .send({ credential: "invalid_jwt_token" });

      global.fetch = originalFetch;

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Google Token ไม่ถูกต้องหรือหมดอายุ");
    });

    it("should return 400 if Google access token fails", async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "invalid_token" }),
      });

      const res = await request(app)
        .post("/api/auth/google")
        .send({ accessToken: "invalid_access_token" });

      global.fetch = originalFetch;

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Google Access Token ไม่ถูกต้องหรือหมดอายุ");
    });

    it("should log in existing user with Google ID and return 200", async () => {
      const existingUser = {
        _id: "googleUserId123",
        username: "googlestreamer",
        email: "streamer@gmail.com",
        googleId: "google_123456",
        avatar: "https://example.com/pic.png",
        isEmailVerified: true,
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(User, "findOne").mockResolvedValueOnce(existingUser);

      const res = await request(app)
        .post("/api/auth/google")
        .send({
          mockUser: {
            sub: "google_123456",
            email: "streamer@gmail.com",
            name: "Google Streamer",
            picture: "https://example.com/pic.png",
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("เข้าสู่ระบบด้วย Google สำเร็จ");
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toBe("streamer@gmail.com");
    });

    it("should register new user if not found and return 200", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null);
      jest.spyOn(User.prototype, "save").mockImplementation(function () {
        this._id = "newGoogleUserId456";
        return Promise.resolve(this);
      });

      const res = await request(app)
        .post("/api/auth/google")
        .send({
          mockUser: {
            sub: "google_78910",
            email: "newstreamer@gmail.com",
            name: "Somchai Google",
            picture: "https://example.com/avatar.png",
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("เข้าสู่ระบบด้วย Google สำเร็จ");
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.username).toBe("newstreamer");
      expect(res.body.data.user.email).toBe("newstreamer@gmail.com");
    });

    it("should link Google ID to existing email account without googleId", async () => {
      const existingUser = {
        _id: "existingUserId789",
        username: "somchai_legacy",
        email: "somchai@gmail.com",
        googleId: null,
        avatar: "",
        isEmailVerified: false,
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(User, "findOne").mockResolvedValueOnce(existingUser);

      const res = await request(app)
        .post("/api/auth/google")
        .send({
          mockUser: {
            sub: "google_linked_999",
            email: "somchai@gmail.com",
            name: "Somchai Jaidee",
            picture: "https://example.com/somchai.png",
          },
        });

      expect(res.status).toBe(200);
      expect(existingUser.googleId).toBe("google_linked_999");
      expect(existingUser.avatar).toBe("https://example.com/somchai.png");
      expect(existingUser.isEmailVerified).toBe(true);
      expect(existingUser.save).toHaveBeenCalled();
    });

    it("should call next with error when database fails during Google auth", async () => {
      jest.spyOn(User, "findOne").mockRejectedValueOnce(new Error("DB Error"));

      const res = await request(app)
        .post("/api/auth/google")
        .send({
          mockUser: {
            sub: "google_error_123",
            email: "error@gmail.com",
          },
        });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่");
    });

    it("should authenticate with valid credential id_token via Google tokeninfo", async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: "google_valid_id",
          email: "realtoken@gmail.com",
          name: "Real Token User",
          picture: "https://example.com/real.png",
        }),
      });

      jest.spyOn(User, "findOne").mockResolvedValue(null);
      jest.spyOn(User.prototype, "save").mockImplementation(function () {
        this._id = "realUserId111";
        return Promise.resolve(this);
      });

      const res = await request(app)
        .post("/api/auth/google")
        .send({ credential: "valid_google_credential_jwt" });

      global.fetch = originalFetch;

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("เข้าสู่ระบบด้วย Google สำเร็จ");
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toBe("realtoken@gmail.com");
    });

    it("should authenticate with valid accessToken via Google userinfo", async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: "google_access_id",
          email: "accessuser@gmail.com",
          name: "Access User",
          picture: "https://example.com/access.png",
        }),
      });

      jest.spyOn(User, "findOne").mockResolvedValue(null);
      jest.spyOn(User.prototype, "save").mockImplementation(function () {
        this._id = "accessUserId222";
        return Promise.resolve(this);
      });

      const res = await request(app)
        .post("/api/auth/google")
        .send({ accessToken: "valid_google_access_token" });

      global.fetch = originalFetch;

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("เข้าสู่ระบบด้วย Google สำเร็จ");
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toBe("accessuser@gmail.com");
    });

    it("should return 400 when tokeninfo returns 200 but sub or email is missing", async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: "google_missing_email" }), // missing email
      });

      const res = await request(app)
        .post("/api/auth/google")
        .send({ credential: "incomplete_token" });

      global.fetch = originalFetch;

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Google Token ไม่ถูกต้องหรือหมดอายุ");
    });

    it("should return 400 when userinfo returns 200 but sub or email is missing", async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: "incomplete@gmail.com" }), // missing sub
      });

      const res = await request(app)
        .post("/api/auth/google")
        .send({ accessToken: "incomplete_access_token" });

      global.fetch = originalFetch;

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Google Access Token ไม่ถูกต้องหรือหมดอายุ");
    });

    it("should handle short email prefix and duplicate username resolution with counter", async () => {
      // Short prefix (<3 chars): "ab@gmail.com"
      // User.findOne:
      // 1: lookup existing user by googleId or email -> null
      // 2: username collision on candidate -> return { username: "user_654321" }
      // 3: next candidate -> null
      jest.spyOn(User, "findOne")
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ username: "user_654321" })
        .mockResolvedValueOnce(null);

      jest.spyOn(User.prototype, "save").mockImplementation(function () {
        this._id = "shortPrefixUserId";
        return Promise.resolve(this);
      });

      const res = await request(app)
        .post("/api/auth/google")
        .send({
          mockUser: {
            sub: "google_sub_654321",
            email: "ab@gmail.com",
            name: "",
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.username).toBe("user_654321_1");
    });
  });

  describe("Forgot Password Flow", () => {
    describe("POST /api/auth/forgot-password/send-otp", () => {
      it("should return 400 if fields are not strings or missing", async () => {
        const res = await request(app)
          .post("/api/auth/forgot-password/send-otp")
          .send({ identifier: 123, channel: "email" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("ข้อมูลไม่ถูกต้อง");
      });

      it("should return 400 if channel is invalid", async () => {
        const res = await request(app)
          .post("/api/auth/forgot-password/send-otp")
          .send({ identifier: "user@example.com", channel: "fax" });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("ช่องทางการส่งรหัสไม่ถูกต้อง");
      });

      it("should return 404 if user is not found", async () => {
        jest.spyOn(User, "findOne").mockResolvedValueOnce(null);

        const res = await request(app)
          .post("/api/auth/forgot-password/send-otp")
          .send({ identifier: "unknown@example.com", channel: "email" });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("ไม่พบบัญชีผู้ใช้ในระบบ");
      });

      it("should return 400 if SMS selected but user has no phone", async () => {
        jest.spyOn(User, "findOne").mockResolvedValueOnce({
          _id: "u123",
          email: "user@example.com",
          phone: "",
        });

        const res = await request(app)
          .post("/api/auth/forgot-password/send-otp")
          .send({ identifier: "user@example.com", channel: "sms" });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("ยังไม่ได้เชื่อมต่อเบอร์โทรศัพท์");
      });

      it("should return 503 when email provider is not configured", async () => {
        jest.spyOn(User, "findOne").mockResolvedValueOnce({
          _id: "u123",
          email: "donor@example.com",
          phone: "0812345678",
        });
        jest.spyOn(Otp, "deleteMany").mockResolvedValue({});
        jest.spyOn(Otp, "create").mockResolvedValueOnce({});

        const res = await request(app)
          .post("/api/auth/forgot-password/send-otp")
          .send({ identifier: "donor@example.com", channel: "email" });

        expect(res.status).toBe(503);
        expect(res.body.message).toContain("ระบบส่งอีเมลยังไม่ได้ตั้งค่า");
        expect(res.body.data).toBeNull();
      });

      it("should successfully send OTP via SMS", async () => {
        jest.spyOn(User, "findOne").mockResolvedValueOnce({
          _id: "u123",
          email: "donor@example.com",
          phone: "0812345678",
        });
        jest.spyOn(Otp, "deleteMany").mockResolvedValueOnce({});
        jest.spyOn(Otp, "create").mockResolvedValueOnce({});

        const res = await request(app)
          .post("/api/auth/forgot-password/send-otp")
          .send({ identifier: "0812345678", channel: "sms" });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain("ส่งรหัส OTP");
        expect(res.body.data.channel).toBe("sms");
        expect(res.body.data.target).toBe("0812345678");
      });
    });

    describe("POST /api/auth/forgot-password/verify-otp", () => {
      it("should return 400 if fields are missing or not strings", async () => {
        const res = await request(app)
          .post("/api/auth/forgot-password/verify-otp")
          .send({ target: 123, otp: "123456" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("ข้อมูลไม่ถูกต้อง");
      });

      it("should return 400 if OTP not found", async () => {
        jest.spyOn(Otp, "findOne").mockResolvedValueOnce(null);

        const res = await request(app)
          .post("/api/auth/forgot-password/verify-otp")
          .send({ target: "test@example.com", otp: "123456" });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("รหัส OTP หมดอายุหรือไม่มีอยู่ในระบบ");
      });

      it("should return 400 if OTP has expired", async () => {
        jest.spyOn(Otp, "findOne").mockResolvedValueOnce({
          _id: "otp1",
          otp: "123456",
          expiresAt: new Date(Date.now() - 10000), // past
          attempts: 0,
        });
        jest.spyOn(Otp, "deleteOne").mockResolvedValueOnce({});

        const res = await request(app)
          .post("/api/auth/forgot-password/verify-otp")
          .send({ target: "test@example.com", otp: "123456" });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("รหัส OTP หมดอายุแล้ว");
      });

      it("should return 400 if max attempts exceeded", async () => {
        jest.spyOn(Otp, "findOne").mockResolvedValueOnce({
          _id: "otp1",
          otp: "123456",
          expiresAt: new Date(Date.now() + 60000),
          attempts: 5,
        });
        jest.spyOn(Otp, "deleteOne").mockResolvedValueOnce({});

        const res = await request(app)
          .post("/api/auth/forgot-password/verify-otp")
          .send({ target: "test@example.com", otp: "123456" });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("คุณกรอกรหัสผิดเกินจำนวนครั้ง");
      });

      it("should return 400 if OTP does not match", async () => {
        const mockOtp = {
          _id: "otp1",
          otp: "123456",
          expiresAt: new Date(Date.now() + 60000),
          attempts: 1,
          save: jest.fn().mockResolvedValue(true),
        };
        jest.spyOn(Otp, "findOne").mockResolvedValueOnce(mockOtp);

        const res = await request(app)
          .post("/api/auth/forgot-password/verify-otp")
          .send({ target: "test@example.com", otp: "999999" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("รหัส OTP ไม่ถูกต้อง");
        expect(mockOtp.attempts).toBe(2);
      });

      it("should successfully verify OTP and return resetToken", async () => {
        const mockOtp = {
          _id: "otp1",
          otp: "123456",
          expiresAt: new Date(Date.now() + 60000),
          attempts: 0,
        };
        jest.spyOn(Otp, "findOne").mockResolvedValueOnce(mockOtp);
        jest.spyOn(User, "findOne").mockResolvedValueOnce({
          _id: "user_valid_id",
          email: "test@example.com",
        });
        jest.spyOn(Otp, "deleteOne").mockResolvedValueOnce({});

        const res = await request(app)
          .post("/api/auth/forgot-password/verify-otp")
          .send({ target: "test@example.com", otp: "123456" });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("ยืนยันรหัส OTP สำเร็จ");
        expect(res.body.data.resetToken).toBeDefined();
      });
    });

    describe("POST /api/auth/forgot-password/reset", () => {
      it("should return 400 if resetToken or newPassword is not a string", async () => {
        const res = await request(app)
          .post("/api/auth/forgot-password/reset")
          .send({ resetToken: 123, newPassword: "Password1!" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("ข้อมูลไม่ถูกต้อง");
      });

      it("should return 400 if resetToken is invalid or expired", async () => {
        const res = await request(app)
          .post("/api/auth/forgot-password/reset")
          .send({ resetToken: "invalid_jwt", newPassword: "Password1!" });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("โทเค็นการรีเซ็ตรหัสผ่านไม่ถูกต้อง");
      });

      it("should return 400 if new password does not meet complexity requirements", async () => {
        const secret = getJwtSecret();
        const validToken = jwt.sign(
          { userId: "u123", purpose: "password_reset" },
          secret,
          { expiresIn: "15m" }
        );

        const res = await request(app)
          .post("/api/auth/forgot-password/reset")
          .send({ resetToken: validToken, newPassword: "weak" });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("รหัสผ่านต้อง");
      });

      it("should successfully reset password", async () => {
        const secret = getJwtSecret();
        const validToken = jwt.sign(
          { userId: "u123", purpose: "password_reset" },
          secret,
          { expiresIn: "15m" }
        );

        const mockUser = {
          _id: "u123",
          password: "oldHashedPassword",
          save: jest.fn().mockResolvedValue(true),
        };
        jest.spyOn(User, "findById").mockResolvedValueOnce(mockUser);

        const res = await request(app)
          .post("/api/auth/forgot-password/reset")
          .send({ resetToken: validToken, newPassword: "NewSecurePassword1!" });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain("ตั้งรหัสผ่านใหม่สำเร็จแล้ว");
        expect(mockUser.save).toHaveBeenCalled();
      });
    });
  });
});
