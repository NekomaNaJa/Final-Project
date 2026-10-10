import request from "supertest";
import jwt from "jsonwebtoken";
import { jest } from "@jest/globals";
import app from "../app.js";
import Widget from "../Models/Widget.js";
import Donation from "../Models/Donation.js";

describe("Widget Routes (/api/widgets)", () => {
  const mockUserId = "60c72b2f9b1d8b2bad876543";
  const jwtSecret = process.env.JWT_SECRET || "donix_jwt_secret_dev";
  const token = jwt.sign({ userId: mockUserId }, jwtSecret);

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(Donation, "aggregate")
      .mockResolvedValue([{ _id: null, total: 0 }]);
  });

  describe("GET /api/widgets/me", () => {
    it("should return 401 if unauthorized without token", async () => {
      const res = await request(app).get("/api/widgets/me");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ");
      expect(res.body.data).toBeNull();
    });

    it("should return 401 if user id in token is not a valid ObjectId", async () => {
      const invalidIdToken = jwt.sign({ userId: "invalid-id" }, jwtSecret);
      const res = await request(app)
        .get("/api/widgets/me")
        .set("Authorization", `Bearer ${invalidIdToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ");
    });

    it("should return 200 and existing widget configuration", async () => {
      const mockWidget = {
        _id: "60c72b2f9b1d8b2bad876999",
        userId: mockUserId,
        token: "test-widget-token-123",
        alert: { minAmount: 20, soundPreset: "dragon-roar" },
        goal: { title: "เป้าหมายใหม่", target: 5000 },
        leaderboard: { title: "อันดับผู้สนับสนุน", limit: 3 },
        mission: { title: "ภารกิจ", missions: [] },
      };

      jest.spyOn(Widget, "findOne").mockResolvedValueOnce(mockWidget);

      const res = await request(app)
        .get("/api/widgets/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("ดึงข้อมูลการตั้งค่าวิดเจ็ตสำเร็จ");
      expect(res.body.data.token).toBe("test-widget-token-123");
      expect(res.body.data.alert.minAmount).toBe(20);
    });

    it("should return 200 and create default widget if none exists", async () => {
      jest.spyOn(Widget, "findOne").mockResolvedValueOnce(null);
      const mockSave = jest.fn().mockResolvedValueOnce(true);
      jest.spyOn(Widget.prototype, "save").mockImplementationOnce(mockSave);

      const res = await request(app)
        .get("/api/widgets/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("ดึงข้อมูลการตั้งค่าวิดเจ็ตสำเร็จ");
      expect(res.body.data).toBeDefined();
      expect(mockSave).toHaveBeenCalled();
    });

    it("should calculate goal.current dynamically from approved donations", async () => {
      const mockWidget = {
        _id: "60c72b2f9b1d8b2bad876999",
        userId: mockUserId,
        token: "test-widget-token-123",
        alert: { minAmount: 20 },
        goal: {
          title: "เป้าหมายใหม่",
          target: 5000,
          current: 0,
          startDate: "2026-09-01",
          endDate: "2026-09-30",
        },
        leaderboard: {},
        mission: {},
      };

      jest.spyOn(Widget, "findOne").mockResolvedValueOnce(mockWidget);
      jest
        .spyOn(Donation, "aggregate")
        .mockResolvedValueOnce([{ _id: null, total: 3500 }]);

      const res = await request(app)
        .get("/api/widgets/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.goal.current).toBe(3500);
    });

    it("should handle server errors gracefully", async () => {
      jest.spyOn(Widget, "findOne").mockRejectedValueOnce(new Error("DB error"));

      const res = await request(app)
        .get("/api/widgets/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.data).toBeNull();
    });
  });

  describe("PUT /api/widgets/me", () => {
    it("should return 401 if unauthorized without token", async () => {
      const res = await request(app)
        .put("/api/widgets/me")
        .send({ alert: { minAmount: 50 } });

      expect(res.status).toBe(401);
      expect(res.body.data).toBeNull();
    });

    it("should return 401 if user id in token is not a valid ObjectId during update", async () => {
      const invalidIdToken = jwt.sign({ userId: "invalid-id" }, jwtSecret);
      const res = await request(app)
        .put("/api/widgets/me")
        .set("Authorization", `Bearer ${invalidIdToken}`)
        .send({ alert: { minAmount: 50 } });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ");
    });

    it("should return 400 if request body is invalid", async () => {
      const res = await request(app)
        .put("/api/widgets/me")
        .set("Authorization", `Bearer ${token}`)
        .send(["invalid-array"]);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ข้อมูลที่ส่งมาไม่ถูกต้อง");
      expect(res.body.data).toBeNull();
    });

    it("should create new widget and update if none exists during PUT", async () => {
      jest.spyOn(Widget, "findOne").mockResolvedValueOnce(null);
      const mockSave = jest.fn().mockResolvedValueOnce(true);
      jest.spyOn(Widget.prototype, "save").mockImplementationOnce(mockSave);

      const res = await request(app)
        .put("/api/widgets/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          goal: { title: "เป้าหมายใหม่เอี่ยม", target: 50000, current: 9999 },
        });

      expect(res.status).toBe(200);
      expect(mockSave).toHaveBeenCalled();
      expect(res.body.data.goal.target).toBe(50000);
    });

    it("should return 200 and update widget settings successfully", async () => {
      const mockWidget = {
        _id: "60c72b2f9b1d8b2bad876999",
        userId: mockUserId,
        token: "old-token",
        alert: {
          minAmount: 10,
          soundPreset: "mythic-horn",
          toObject: () => ({ minAmount: 10, soundPreset: "mythic-horn" }),
        },
        goal: {
          title: "เป้าหมายเดิม",
          target: 10000,
          toObject: () => ({ title: "เป้าหมายเดิม", target: 10000 }),
        },
        leaderboard: {
          title: "Top เดิม",
          limit: 5,
          toObject: () => ({ title: "Top เดิม", limit: 5 }),
        },
        mission: {
          title: "ภารกิจเดิม",
          missions: [],
          toObject: () => ({ title: "ภารกิจเดิม", missions: [] }),
        },
        save: jest.fn().mockResolvedValueOnce(true),
      };

      jest.spyOn(Widget, "findOne").mockResolvedValueOnce(mockWidget);

      const res = await request(app)
        .put("/api/widgets/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          alert: { minAmount: 100, soundPreset: "dragon-roar" },
          goal: { target: 20000 },
          leaderboard: { limit: 10 },
          mission: { title: "ภารกิจใหม่" },
          regenerateToken: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("บันทึกการตั้งค่าวิดเจ็ตสำเร็จ");
      expect(mockWidget.save).toHaveBeenCalled();
      expect(mockWidget.alert.minAmount).toBe(100);
      expect(mockWidget.goal.target).toBe(20000);
      expect(mockWidget.token).not.toBe("old-token");
    });

    it("should emit widget-config-updated through req.io if available", async () => {
      const mockIo = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };
      app.set("io", mockIo);

      const mockWidget = {
        _id: "60c72b2f9b1d8b2bad876999",
        userId: mockUserId,
        token: "live-token-456",
        alert: {},
        goal: { title: "เป้าหมาย", target: 500 },
        leaderboard: {},
        mission: {},
        save: jest.fn().mockResolvedValueOnce(true),
      };

      jest.spyOn(Widget, "findOne").mockResolvedValueOnce(mockWidget);

      const res = await request(app)
        .put("/api/widgets/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ goal: { target: 500 } });

      expect(res.status).toBe(200);
      expect(mockIo.to).toHaveBeenCalledWith("live-token-456");
      expect(mockIo.emit).toHaveBeenCalledWith(
        "widget-config-updated",
        expect.objectContaining({ token: "live-token-456" })
      );

      // Clean up app io
      app.set("io", null);
    });

    it("should handle server error during update", async () => {
      jest.spyOn(Widget, "findOne").mockRejectedValueOnce(new Error("Update failure"));

      const res = await request(app)
        .put("/api/widgets/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ alert: { minAmount: 50 } });

      expect(res.status).toBe(500);
      expect(res.body.data).toBeNull();
    });
  });
});
