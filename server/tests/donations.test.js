import request from "supertest";
import { jest } from "@jest/globals";
import app from "../app.js";
import User from "../Models/User.js";
import Donation from "../Models/Donation.js";

describe("Donation Route (POST /api/donations)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validStreamer = {
    _id: "60c72b2f9b1d8b2bad876543",
    username: "pro_gamer",
    isLive: true,
    donationPage: {
      minAmount: 15,
      disableFilter: false,
      filteredWords: ["คำหยาบ"],
    },
    payment: {
      promptpay: { enabled: true, number: "0812345678" },
      bank: { enabled: true, accountNumber: "123456" },
      truemoney: { enabled: false },
    },
  };

  it("should return 400 if required fields are missing or wrong types", async () => {
    const res = await request(app)
      .post("/api/donations")
      .send({ username: 123, amount: "not-a-number", paymentMethod: "promptpay" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("ข้อมูลไม่ถูกต้อง");
    expect(res.body.data).toBeNull();
  });

  it("should return 400 if paymentMethod is invalid", async () => {
    const res = await request(app)
      .post("/api/donations")
      .send({
        username: "pro_gamer",
        amount: 50,
        paymentMethod: "crypto",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("ช่องทางการชำระเงินไม่ถูกต้อง");
  });

  it("should return 400 if amount is <= 0", async () => {
    const res = await request(app)
      .post("/api/donations")
      .send({
        username: "pro_gamer",
        amount: 0,
        paymentMethod: "promptpay",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("จำนวนเงินต้องมากกว่า 0 บาท");
  });

  it("should return 404 if streamer is not found", async () => {
    jest.spyOn(User, "findOne").mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/donations")
      .send({
        username: "nonexistent",
        amount: 50,
        paymentMethod: "promptpay",
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ไม่พบสตรีมเมอร์นี้");
  });

  it("should return 400 if streamer is offline (isLive = false)", async () => {
    jest.spyOn(User, "findOne").mockResolvedValueOnce({
      ...validStreamer,
      isLive: false,
    });

    const res = await request(app)
      .post("/api/donations")
      .send({
        username: "pro_gamer",
        amount: 50,
        paymentMethod: "promptpay",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("ขณะนี้สตรีมเมอร์ปิดรับโดเนทชั่วคราว");
  });

  it("should return 400 if amount is less than minAmount", async () => {
    jest.spyOn(User, "findOne").mockResolvedValueOnce(validStreamer);

    const res = await request(app)
      .post("/api/donations")
      .send({
        username: "pro_gamer",
        amount: 10, // min is 15
        paymentMethod: "promptpay",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("จำนวนเงินต้องไม่ต่ำกว่ายอดขั้นต่ำ 15 บาท");
  });

  it("should return 400 if payment method is disabled by streamer", async () => {
    jest.spyOn(User, "findOne").mockResolvedValueOnce(validStreamer);

    const res = await request(app)
      .post("/api/donations")
      .send({
        username: "pro_gamer",
        amount: 50,
        paymentMethod: "truemoney", // disabled in validStreamer
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("ช่องทางการชำระเงินนี้ไม่พร้อมให้บริการ");
  });

  it("should return 201, filter bad words, and save donation successfully", async () => {
    jest.spyOn(User, "findOne").mockResolvedValueOnce(validStreamer);
    jest.spyOn(Donation.prototype, "save").mockResolvedValueOnce();

    const mockIoEmit = jest.fn();
    const mockTo = jest.fn().mockReturnValue({ emit: mockIoEmit });
    app.set("io", { to: mockTo });

    const res = await request(app)
      .post("/api/donations")
      .send({
        username: "pro_gamer",
        donorName: "ใจดีจัง",
        amount: 100,
        message: "สู้ๆ นะครับ คำหยาบ อย่าไปยอมแพ้",
        paymentMethod: "promptpay",
        slipImage: "data:image/png;base64,sampleimagebase64",
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("สร้างรายการโดเนทสำเร็จ");
    expect(res.body.data.donorName).toBe("ใจดีจัง");
    expect(res.body.data.amount).toBe(100);
    // Bad word filtered
    expect(res.body.data.message).toBe("สู้ๆ นะครับ *** อย่าไปยอมแพ้");
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.slipImage).toBe("data:image/png;base64,sampleimagebase64");

    // Socket alert emitted
    expect(mockTo).toHaveBeenCalledWith(`streamer_${validStreamer._id}`);
    expect(mockIoEmit).toHaveBeenCalledWith("donation-alert", expect.any(Object));

    // Clear mock io on app
    app.set("io", null);
  });

  it("should return 500 when saving donation fails", async () => {
    jest.spyOn(User, "findOne").mockResolvedValueOnce(validStreamer);
    jest.spyOn(Donation.prototype, "save").mockRejectedValueOnce(new Error("Database write error"));

    const res = await request(app)
      .post("/api/donations")
      .send({
        username: "pro_gamer",
        amount: 50,
        paymentMethod: "promptpay",
      });

    expect(res.status).toBe(500);
    expect(res.body.data).toBeNull();
  });
});
