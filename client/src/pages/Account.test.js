import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Account from "./Account";

const makeToken = (payload) =>
  `header.${btoa(JSON.stringify(payload))}.signature`;

const renderAccount = () =>
  render(
    <MemoryRouter initialEntries={["/account"]}>
      <Routes>
        <Route path="/account" element={<Account />} />
        <Route path="/login" element={<div>หน้าเข้าสู่ระบบ</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("Account page", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const okResponse = (user) => ({
    ok: true,
    json: async () => ({ user }),
  });

  it("แสดงชื่อผู้ใช้จาก JWT และดึงข้อมูลเพิ่มเติมจาก /api/auth/me", async () => {
    localStorage.setItem("token", makeToken({ username: "streamer_pro" }));
    global.fetch.mockResolvedValue(
      okResponse({ username: "streamer_pro", email: "user@donix.app" }),
    );

    renderAccount();

    expect(screen.getAllByText("streamer_pro").length).toBeGreaterThan(0);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/me"),
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
    );

    await waitFor(() =>
      expect(screen.getByText("user@donix.app")).toBeInTheDocument(),
    );
  });

  it("ไม่ยิง request เมื่อไม่มี token", () => {
    renderAccount();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("ล้าง token และกลับไปหน้า login เมื่อ token หมดอายุ", async () => {
    const token = makeToken({ username: "expired_user" });
    localStorage.setItem("token", token);
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }),
    });

    renderAccount();

    await waitFor(() =>
      expect(screen.getByText("หน้าเข้าสู่ระบบ")).toBeInTheDocument(),
    );
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("เก็บ token ไว้เมื่อเซิร์ฟเวอร์ตอบกลับผิดพลาดอื่น", async () => {
    localStorage.setItem("token", makeToken({ username: "u" }));
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" }),
    });

    renderAccount();

    await waitFor(() =>
      expect(localStorage.getItem("token")).not.toBeNull(),
    );
  });

  it("รองรับกรณี server ตอบกลับมาไม่ใช่ JSON", async () => {
    localStorage.setItem("token", makeToken({ username: "u" }));
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error("Unexpected token <");
      },
    });

    renderAccount();

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledTimes(1),
    );
  });

  it("ล็อกเอาต์แล้วล้าง token พร้อมกลับหน้า login", async () => {
    localStorage.setItem("token", makeToken({ username: "u" }));
    global.fetch.mockResolvedValue(okResponse({ username: "u" }));

    renderAccount();

    fireEvent.click(screen.getByRole("button", { name: /ออกจากระบบ/i }));

    await waitFor(() => expect(localStorage.getItem("token")).toBeNull());
    expect(screen.getByText("หน้าเข้าสู่ระบบ")).toBeInTheDocument();
  });

  it("แสดงชื่อ Streamer เมื่อไม่มีข้อมูลผู้ใช้", async () => {
    localStorage.setItem("token", makeToken({}));
    global.fetch.mockResolvedValue(okResponse({}));

    renderAccount();

    await waitFor(() =>
      expect(screen.getByText("Streamer")).toBeInTheDocument(),
    );
  });
});
