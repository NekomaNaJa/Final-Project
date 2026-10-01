import {
  clearToken,
  getToken,
  getTokenPayload,
  setToken,
} from "./auth";

const makeToken = (payload) =>
  `header.${btoa(JSON.stringify(payload))}.signature`;

// base64url (ใช้ - และ _ แทน + และ /) ต้องถูกแปลงกลับเป็น base64 ก่อน atob
const makeBase64UrlToken = (payload) => {
  const utf8 = new TextEncoder().encode(JSON.stringify(payload));
  const base64 = btoa(
    utf8.reduce((acc, byte) => acc + String.fromCharCode(byte), ""),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `header.${base64}.signature`;
};

describe("auth utils", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getToken / setToken / clearToken", () => {
    it("บันทึกและอ่าน token จาก localStorage", () => {
      expect(getToken()).toBeNull();

      setToken("abc123");
      expect(getToken()).toBe("abc123");

      clearToken();
      expect(getToken()).toBeNull();
    });
  });

  describe("getTokenPayload", () => {
    it("คืน null เมื่อไม่มี token", () => {
      expect(getTokenPayload()).toBeNull();
    });

    it("ถอด payload จาก token ที่ยังไม่หมดอายุ", () => {
      setToken(makeToken({ username: "streamer_pro", role: "streamer" }));

      expect(getTokenPayload()).toEqual({
        username: "streamer_pro",
        role: "streamer",
      });
      expect(localStorage.getItem("token")).not.toBeNull();
    });

    it("รองรับ token ที่ encode แบบ base64url", () => {
      const payload = { username: "ก-ผู้ใช้" };
      setToken(makeBase64UrlToken(payload));

      expect(getTokenPayload()).toEqual(payload);
    });

    it("ล้าง token และคืน null เมื่อ token หมดอายุแล้ว", () => {
      setToken(makeToken({ username: "old", exp: 1000 }));

      expect(getTokenPayload()).toBeNull();
      expect(localStorage.getItem("token")).toBeNull();
    });

    it("คืน payload ได้เมื่อยังไม่ถึงเวลาหมดอายุ", () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      setToken(makeToken({ username: "fresh", exp }));

      expect(getTokenPayload()).toEqual({ username: "fresh", exp });
    });

    it("ล้าง token และคืน null เมื่อ token เสีย", () => {
      setToken("not-a-jwt");

      expect(getTokenPayload()).toBeNull();
      expect(localStorage.getItem("token")).toBeNull();
    });

    it("ล้าง token และคืน null เมื่อ payload ไม่ใช่ JSON", () => {
      setToken("header.bm90LWpzb24.signature");

      expect(getTokenPayload()).toBeNull();
      expect(localStorage.getItem("token")).toBeNull();
    });
  });
});
