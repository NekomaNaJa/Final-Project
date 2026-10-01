import { API, API_URL, parseResponse } from "./api";

describe("api utils", () => {
  it("ประกอบ URL ของแต่ละ endpoint จาก API_URL", () => {
    expect(API_URL).toContain("/api");
    expect(API.login).toBe(`${API_URL}/auth/login`);
    expect(API.register).toBe(`${API_URL}/auth/register`);
    expect(API.me).toBe(`${API_URL}/auth/me`);
  });

  describe("parseResponse", () => {
    it("คืนข้อมูลจาก response ที่สำเร็จ", async () => {
      const res = { ok: true, json: async () => ({ token: "abc" }) };

      await expect(parseResponse(res)).resolves.toEqual({ token: "abc" });
    });

    it("โยน error พร้อมข้อความจาก server เมื่ะสถานะไม่ ok", async () => {
      const res = {
        ok: false,
        json: async () => ({ message: "Email หรือรหัสผ่านไม่ถูกต้อง" }),
      };

      await expect(parseResponse(res)).rejects.toThrow(
        "Email หรือรหัสผ่านไม่ถูกต้อง",
      );
    });

    it("ใช้ข้อความสำรองเมื่อ server ไม่ได้ส่ง message มา", async () => {
      const res = { ok: false, json: async () => ({}) };

      await expect(parseResponse(res)).rejects.toThrow(
        "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      );
    });

    it("ไม่พังเมื่อ body ไม่ใช่ JSON และ response ไม่ ok", async () => {
      const res = {
        ok: false,
        json: async () => {
          throw new Error("Unexpected token <");
        },
      };

      await expect(parseResponse(res)).rejects.toThrow(
        "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      );
    });

    it("คืน object ว่างเมื่อ body ไม่ใช่ JSON แต่ response สำเร็จ", async () => {
      const res = {
        ok: true,
        json: async () => {
          throw new Error("Unexpected token <");
        },
      };

      await expect(parseResponse(res)).resolves.toEqual({});
    });
  });
});
