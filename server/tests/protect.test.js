import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import protect from "../middleware/protect.js";

describe("Protect Middleware", () => {
  const secret = process.env.JWT_SECRET || "donix_jwt_secret_dev";
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should return 401 when Authorization header is missing", () => {
    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ",
      data: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when Authorization header does not start with Bearer", () => {
    req.headers.authorization = "Basic somenontoken";

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ",
      data: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when token is invalid or malformed", () => {
    req.headers.authorization = "Bearer invalid.token.value";

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Token ไม่ถูกต้องหรือหมดอายุ",
      data: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when token is expired", () => {
    const expiredToken = jwt.sign(
      { userId: "mock123", username: "expiredUser" },
      secret,
      { expiresIn: "-1s" }
    );
    req.headers.authorization = `Bearer ${expiredToken}`;

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Token ไม่ถูกต้องหรือหมดอายุ",
      data: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should attach decoded user to req.user and call next() when token is valid", () => {
    const validToken = jwt.sign(
      { userId: "mock123", username: "validUser", email: "user@example.com" },
      secret
    );
    req.headers.authorization = `Bearer ${validToken}`;

    protect(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe("mock123");
    expect(req.user.username).toBe("validUser");
    expect(next).toHaveBeenCalledTimes(1);
  });
});
