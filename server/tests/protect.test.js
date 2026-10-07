import request from "supertest";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
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
});
