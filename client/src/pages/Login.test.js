import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Login from "./Login";

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<div>แดชบอร์ด</div>} />
      </Routes>
    </MemoryRouter>,
  );

const fillForm = (email, password) => {
  fireEvent.change(screen.getByPlaceholderText("Streamer@Donix.com"), {
    target: { name: "email", value: email },
  });
  fireEvent.change(screen.getByPlaceholderText("*************"), {
    target: { name: "password", value: password },
  });
};

describe("Login page", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("เข้าสู่ระบบสำเร็จ บันทึก token และไปหน้า dashboard", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "jwt-token" }),
    });

    renderLogin();
    fillForm("user@donix.app", "Password1!");
    fireEvent.click(screen.getByRole("button", { name: /เข้าสู่ระบบ/i }));

    await waitFor(() =>
      expect(screen.getByText("แดชบอร์ด")).toBeInTheDocument(),
    );
    expect(localStorage.getItem("token")).toBe("jwt-token");
  });

  it("ยิง request ไปยัง endpoint ที่ถูกต้องพร้อม body จากฟอร์ม", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "jwt-token" }),
    });

    renderLogin();
    fillForm("user@donix.app", "Password1!");
    fireEvent.click(screen.getByRole("button", { name: /เข้าสู่ระบบ/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain("/auth/login");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      email: "user@donix.app",
      password: "Password1!",
    });
  });

  it("แสดงข้อความ error จาก server และไม่บันทึก token", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Email หรือรหัสผ่านไม่ถูกต้อง" }),
    });

    renderLogin();
    fillForm("user@donix.app", "wrongpass1!");
    fireEvent.click(screen.getByRole("button", { name: /เข้าสู่ระบบ/i }));

    await waitFor(() =>
      expect(
        screen.getByText("Email หรือรหัสผ่านไม่ถูกต้อง"),
      ).toBeInTheDocument(),
    );
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("ใช้ข้อความสำรองเมื่อเซิร์ฟเวอร์ล่มและไม่มีข้อความกลับมา", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error("Unexpected token <");
      },
    });

    renderLogin();
    fillForm("user@donix.app", "Password1!");
    fireEvent.click(screen.getByRole("button", { name: /เข้าสู่ระบบ/i }));

    await waitFor(() =>
      expect(
        screen.getByText("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"),
      ).toBeInTheDocument(),
    );
  });

  it("แสดงข้อความ fallback เมื่อ error ไม่มี message", async () => {
    global.fetch.mockRejectedValue(new Error());

    renderLogin();
    fillForm("user@donix.app", "Password1!");
    fireEvent.click(screen.getByRole("button", { name: /เข้าสู่ระบบ/i }));

    await waitFor(() =>
      expect(
        screen.getByText("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่"),
      ).toBeInTheDocument(),
    );
  });
});
