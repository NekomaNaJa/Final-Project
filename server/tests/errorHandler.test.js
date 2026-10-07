import request from "supertest";
import express from "express";
import errorHandler, { AppError } from "../middleware/errorHandler.js";

describe("ErrorHandler Middleware", () => {
  let testApp;

  beforeEach(() => {
    testApp = express();
    testApp.use(express.json());
  });

  it("should handle custom AppError with specified status code", async () => {
    testApp.get("/test-app-error", () => {
      throw new AppError("ข้อมูลไม่ถูกต้องตามรูปแบบ", 422);
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get("/test-app-error");

    expect(res.status).toBe(422);
    expect(res.body.message).toBe("ข้อมูลไม่ถูกต้องตามรูปแบบ");
    expect(res.body.data).toBeNull();
  });

  it("should handle Mongoose duplicate key error (code 11000)", async () => {
    testApp.get("/test-duplicate", () => {
      const err = new Error("E11000 duplicate key");
      err.code = 11000;
      throw err;
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get("/test-duplicate");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("ข้อมูลนี้ถูกใช้งานแล้วในระบบ");
    expect(res.body.data).toBeNull();
  });

  it("should handle Mongoose ValidationError", async () => {
    testApp.get("/test-validation", () => {
      const err = new Error("Validation failed");
      err.name = "ValidationError";
      throw err;
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get("/test-validation");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("ข้อมูลที่ส่งมาไม่ถูกต้องตามเงื่อนไข");
    expect(res.body.data).toBeNull();
  });

  it("should handle Mongoose CastError (invalid ObjectId)", async () => {
    testApp.get("/test-cast", () => {
      const err = new Error("Cast to ObjectId failed");
      err.name = "CastError";
      throw err;
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get("/test-cast");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("รูปแบบข้อมูลระบุตัวตนไม่ถูกต้อง");
    expect(res.body.data).toBeNull();
  });

  it("should mask generic 500 error messages", async () => {
    testApp.get("/test-generic", () => {
      throw new Error("Sensitive database crash details");
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get("/test-generic");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่");
    expect(res.body.data).toBeNull();
  });
});
