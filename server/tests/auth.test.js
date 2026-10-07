import request from "supertest";
import { jest } from "@jest/globals";
import bcrypt from "bcryptjs";
import app from "../app.js";
import User from "../Models/User.js";

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
});
