import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Register from "./Register";

const renderRegister = () =>
  render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<div>แดชบอร์ด</div>} />
      </Routes>
    </MemoryRouter>,
  );

const fillForm = ({ username, email, password }) => {
  fireEvent.change(screen.getByPlaceholderText("Streamer"), {
    target: { name: "username", value: username },
  });
  fireEvent.change(screen.getByPlaceholderText("Streamer@Donix.com"), {
    target: { name: "email", value: email },
  });
  fireEvent.change(screen.getByPlaceholderText("อย่างน้อย 8 ตัวอักษร"), {
    target: { name: "password", value: password },
  });
};

const agree = () => fireEvent.click(screen.getByRole("checkbox"));

describe("Register page", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("สมัครสมาชิกสำเร็จ บันทึก token และไปหน้า dashboard", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "jwt-token" }),
    });

    renderRegister();
    fillForm({
      username: "streamer_pro",
      email: "user@donix.app",
      password: "Password1!",
    });
    agree();
    fireEvent.click(screen.getByRole("button", { name: /สมัครสมาชิก/i }));

    await waitFor(() =>
      expect(screen.getByText("แดชบอร์ด")).toBeInTheDocument(),
    );
    expect(localStorage.getItem("token")).toBe("jwt-token");
    expect(global.fetch.mock.calls[0][0]).toContain("/auth/register");
  });

  it("บล็อกการสมัครเมื่อยังไม่ยอมรับข้อตกลง", () => {
    renderRegister();
    fillForm({
      username: "streamer_pro",
      email: "user@donix.app",
      password: "Password1!",
    });
    fireEvent.click(screen.getByRole("button", { name: /สมัครสมาชิก/i }));

    expect(
      screen.getByText("กรุณายอมรับข้อตกลงก่อน"),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("แสดงข้อความจากกฎรหัสผ่านเมื่อรหัสผ่านไม่ผ่านเงื่อนไข", () => {
    renderRegister();
    fillForm({
      username: "streamer_pro",
      email: "user@donix.app",
      password: "weak",
    });
    agree();
    fireEvent.click(screen.getByRole("button", { name: /สมัครสมาชิก/i }));

    expect(
      screen.getByText("รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร"),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("แสดงข้อความ error จาก server เมื่ออีเมลซ้ำ", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Email นี้ถูกใช้งานแล้ว" }),
    });

    renderRegister();
    fillForm({
      username: "streamer_pro",
      email: "dup@donix.app",
      password: "Password1!",
    });
    agree();
    fireEvent.click(screen.getByRole("button", { name: /สมัครสมาชิก/i }));

    await waitFor(() =>
      expect(screen.getByText("Email นี้ถูกใช้งานแล้ว")).toBeInTheDocument(),
    );
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("ใช้ข้อความ fallback เมื่อ error ไม่มี message", async () => {
    global.fetch.mockRejectedValue(new Error());

    renderRegister();
    fillForm({
      username: "streamer_pro",
      email: "user@donix.app",
      password: "Password1!",
    });
    agree();
    fireEvent.click(screen.getByRole("button", { name: /สมัครสมาชิก/i }));

    await waitFor(() =>
      expect(
        screen.getByText("สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่"),
      ).toBeInTheDocument(),
    );
  });

  it("เปิดและปิด modal นโยบายความเป็นส่วนตัวและเงื่อนไขการให้บริการ", () => {
    renderRegister();

    fireEvent.click(screen.getByText("นโยบายความเป็นส่วนตัว"));
    expect(
      screen.getByText("เนื้อหานโยบายความเป็นส่วนตัวของ DONIX"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("ปิด"));

    fireEvent.click(screen.getByText("เงื่อนไขการให้บริการ"));
    expect(
      screen.getByText("เนื้อหาเงื่อนไขการให้บริการของ DONIX"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("ปิด"));

    expect(
      screen.queryByText("เนื้อหาเงื่อนไขการให้บริการของ DONIX"),
    ).not.toBeInTheDocument();
  });
});
