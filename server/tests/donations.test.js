import request from "supertest";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../app.js";
import Donation from "../Models/Donation.js";

describe("Donations Route", () => {
  const secret = process.env.JWT_SECRET || "donix_jwt_secret_dev";
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const otherUserId = new mongoose.Types.ObjectId().toString();
  const mockDonationId = new mongoose.Types.ObjectId().toString();

  const token = jwt.sign(
    { userId: mockUserId, username: "streamer1" },
    secret
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/donations", () => {
    it("should return 401 when Authorization header is missing", async () => {
      const res = await request(app).get("/api/donations");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ");
      expect(res.body.data).toBeNull();
    });

    it("should return 401 when token is invalid", async () => {
      const res = await request(app)
        .get("/api/donations")
        .set("Authorization", "Bearer invalid-token");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token ไม่ถูกต้องหรือหมดอายุ");
    });

    it("should return 200 with donations list and pagination", async () => {
      const mockDonations = [
        {
          _id: mockDonationId,
          streamerId: mockUserId,
          donorName: "Alice",
          amount: 100,
          status: "pending",
          createdAt: new Date(),
        },
      ];

      jest.spyOn(Donation, "countDocuments").mockResolvedValueOnce(1);
      jest.spyOn(Donation, "find").mockReturnValueOnce({
        sort: jest.fn().mockReturnValueOnce({
          skip: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce(mockDonations),
          }),
        }),
      });

      const res = await request(app)
        .get("/api/donations?page=1&limit=10")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("ดึงรายการบริจาคสำเร็จ");
      expect(res.body.data.donations).toHaveLength(1);
      expect(res.body.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it("should filter by status and search keyword", async () => {
      jest.spyOn(Donation, "countDocuments").mockResolvedValueOnce(0);
      jest.spyOn(Donation, "find").mockReturnValueOnce({
        sort: jest.fn().mockReturnValueOnce({
          skip: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      const res = await request(app)
        .get("/api/donations?status=approved&search=Alice")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.donations).toEqual([]);
    });

    it("should handle server errors gracefully", async () => {
      jest.spyOn(Donation, "countDocuments").mockRejectedValueOnce(new Error("DB error"));

      const res = await request(app)
        .get("/api/donations")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/donations/stats", () => {
    it("should return 401 when Authorization is missing", async () => {
      const res = await request(app).get("/api/donations/stats");

      expect(res.status).toBe(401);
    });

    it("should return 200 with aggregated stats, top donors, chart data, and recent donations", async () => {
      jest
        .spyOn(Donation, "aggregate")
        .mockResolvedValueOnce([{ totalAmount: 5000, totalDonations: 10 }]) // summary
        .mockResolvedValueOnce([
          { _id: "TopGamer", totalAmount: 3000, donationCount: 5 },
        ]) // topDonors
        .mockResolvedValueOnce([
          { _id: new Date().toISOString().slice(0, 10), amount: 1500 },
        ]) // daily 7D
        .mockResolvedValueOnce([]) // daily 30D
        .mockResolvedValueOnce([{ _id: new Date().getMonth() + 1, amount: 5000 }]); // monthly

      jest.spyOn(Donation, "countDocuments").mockResolvedValueOnce(2); // pendingCount
      jest.spyOn(Donation, "find").mockReturnValueOnce({
        sort: jest.fn().mockReturnValueOnce({
          limit: jest.fn().mockResolvedValueOnce([
            {
              _id: mockDonationId,
              donorName: "RecentDonor",
              amount: 200,
              status: "approved",
            },
          ]),
        }),
      });

      const res = await request(app)
        .get("/api/donations/stats")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("ดึงข้อมูลสถิติสำเร็จ");
      expect(res.body.data.totalAmount).toBe(5000);
      expect(res.body.data.totalDonations).toBe(10);
      expect(res.body.data.pendingCount).toBe(2);
      expect(res.body.data.topDonors[0].name).toBe("TopGamer");
      expect(res.body.data.topDonors[0].badge).toBe("MYTHIC");
      expect(res.body.data.chartData["7D"]).toHaveLength(7);
      expect(res.body.data.chartData["30D"]).toHaveLength(30);
      expect(res.body.data.recentDonations).toHaveLength(1);
    });

    it("should handle server errors gracefully on stats", async () => {
      jest.spyOn(Donation, "aggregate").mockRejectedValueOnce(new Error("Aggregation failed"));

      const res = await request(app)
        .get("/api/donations/stats")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(500);
    });
  });

  describe("PATCH /api/donations/:id", () => {
    it("should return 401 when Authorization is missing", async () => {
      const res = await request(app)
        .patch(`/api/donations/${mockDonationId}`)
        .send({ status: "approved" });

      expect(res.status).toBe(401);
    });

    it("should return 400 when donation ID is invalid", async () => {
      const res = await request(app)
        .patch("/api/donations/invalid-id")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "approved" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ID รายการบริจาคไม่ถูกต้อง");
    });

    it("should return 400 when status is invalid", async () => {
      const res = await request(app)
        .patch(`/api/donations/${mockDonationId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "cancelled" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("สถานะต้องเป็น approved หรือ rejected");
    });

    it("should return 400 when status is not a string", async () => {
      const res = await request(app)
        .patch(`/api/donations/${mockDonationId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: 123 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("สถานะไม่ถูกต้อง");
    });

    it("should return 404 when donation is not found", async () => {
      jest.spyOn(Donation, "findById").mockResolvedValueOnce(null);

      const res = await request(app)
        .patch(`/api/donations/${mockDonationId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "approved" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("ไม่พบรายการบริจาค");
    });

    it("should return 403 when donation belongs to another streamer", async () => {
      jest.spyOn(Donation, "findById").mockResolvedValueOnce({
        _id: mockDonationId,
        streamerId: otherUserId,
        status: "pending",
      });

      const res = await request(app)
        .patch(`/api/donations/${mockDonationId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "approved" });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("ไม่มีสิทธิ์จัดการรายการบริจาคนี้");
    });

    it("should approve donation and emit socket event when req.io exists", async () => {
      const mockEmit = jest.fn();
      const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
      app.set("io", { to: mockTo });

      const mockDonation = {
        _id: mockDonationId,
        streamerId: mockUserId,
        status: "pending",
        save: jest.fn().mockResolvedValueOnce(true),
      };

      jest.spyOn(Donation, "findById").mockResolvedValueOnce(mockDonation);

      const res = await request(app)
        .patch(`/api/donations/${mockDonationId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "approved" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("อนุมัติรายการบริจาคสำเร็จ");
      expect(mockDonation.status).toBe("approved");
      expect(mockDonation.save).toHaveBeenCalled();
      expect(mockTo).toHaveBeenCalledWith(String(mockUserId));
      expect(mockEmit).toHaveBeenCalledWith("donation-alert", mockDonation);
    });

    it("should reject donation successfully", async () => {
      const mockDonation = {
        _id: mockDonationId,
        streamerId: mockUserId,
        status: "pending",
        save: jest.fn().mockResolvedValueOnce(true),
      };

      jest.spyOn(Donation, "findById").mockResolvedValueOnce(mockDonation);

      const res = await request(app)
        .patch(`/api/donations/${mockDonationId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "rejected" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("ปฏิเสธรายการบริจาคสำเร็จ");
      expect(mockDonation.status).toBe("rejected");
    });
  });
});
