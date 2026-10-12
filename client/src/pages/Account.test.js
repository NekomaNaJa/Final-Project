import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Account from "./Account";
import * as api from "../utils/api";

jest.mock("../utils/api", () => {
  const original = jest.requireActual("../utils/api");
  return {
    ...original,
    fetchCurrentUser: jest.fn(),
    updateCurrentUser: jest.fn(),
    changePassword: jest.fn(),
    sendForgotPasswordOtp: jest.fn(),
    verifyForgotPasswordOtp: jest.fn(),
    sendLinkOtp: jest.fn(),
    verifyLinkOtp: jest.fn(),
  };
});

describe("Account Page Integration", () => {
  const validPayload = btoa(JSON.stringify({ userId: "123", username: "streamer_alpha" }));
  const validToken = `header.${validPayload}.signature`;

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("redirects to /login when no token exists", async () => {
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Routes>
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<div>เข้าสู่ระบบ</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("เข้าสู่ระบบ")).toBeInTheDocument();
    });
  });

  test("redirects to /login when token is malformed", async () => {
    localStorage.setItem("token", "corrupted.token");

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Routes>
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<div>เข้าสู่ระบบ</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("เข้าสู่ระบบ")).toBeInTheDocument();
    });
  });

  test("renders Account page and populates profile from fetchCurrentUser", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      nickname: "Alpha",
      email: "alpha@donix.app",
      bio: "Pro gamer stream",
      social: { facebook: "https://facebook.com/alpha" },
    });

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Account />
      </MemoryRouter>
    );

    expect(screen.getByText("My Account")).toBeInTheDocument();
    expect(screen.getAllByText("streamer_alpha").length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(api.fetchCurrentUser).toHaveBeenCalled();
    });
  });

  test("saves profile successfully and displays success notification", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      nickname: "Alpha",
    });
    api.updateCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      nickname: "AlphaPrime",
    });

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Account />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Account")).toBeInTheDocument();
    });

    // Switch to User Info tab
    fireEvent.click(screen.getByRole("button", { name: "ข้อมูลผู้ใช้งาน" }));
    expect(screen.getByText("USER INFORMATION")).toBeInTheDocument();

    // Click Save button in User Info
    const saveBtns = screen.getAllByRole("button", { name: /บันทึก/i });
    fireEvent.click(saveBtns[0]);

    await waitFor(() => {
      expect(api.updateCurrentUser).toHaveBeenCalled();
      expect(screen.getByText("บันทึกข้อมูลเรียบร้อยแล้ว")).toBeInTheDocument();
    });
  });

  test("displays error notification when updateCurrentUser fails", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      nickname: "Alpha",
    });
    api.updateCurrentUser.mockRejectedValueOnce(new Error("ข้อมูล nickname ไม่ถูกต้อง"));

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Account />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Account")).toBeInTheDocument();
    });

    // Switch to User Info tab
    fireEvent.click(screen.getByRole("button", { name: "ข้อมูลผู้ใช้งาน" }));
    const saveBtns = screen.getAllByRole("button", { name: /บันทึก/i });
    fireEvent.click(saveBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("ข้อมูล nickname ไม่ถูกต้อง")).toBeInTheDocument();
    });
  });

  test("handles logout by clearing token and navigating to login", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
    });

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Routes>
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<div>เข้าสู่ระบบสำเร็จ</div>} />
        </Routes>
      </MemoryRouter>
    );

    const logoutBtn = screen.getByRole("button", { name: /ออกจากระบบ/i });
    fireEvent.click(logoutBtn);

    expect(localStorage.getItem("token")).toBeNull();
    expect(screen.getByText("เข้าสู่ระบบสำเร็จ")).toBeInTheDocument();
  });

  test("toggles isLive status when clicking switch", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      isLive: false,
    });
    api.updateCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      isLive: true,
    });

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Account />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("ปิดรับโดเนท (OFFLINE)")).toBeInTheDocument();
    });

    const toggleBtn = screen.getByRole("switch");
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(api.updateCurrentUser).toHaveBeenCalledWith({ isLive: true });
    });
  });

  test("requests OTP and verifies in SecurityTab to redirect to /forgot-password", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      email: "alpha@example.com",
    });
    api.sendForgotPasswordOtp.mockResolvedValueOnce({
      target: "alpha@example.com",
      maskedTarget: "a***@example.com",
    });
    api.verifyForgotPasswordOtp.mockResolvedValueOnce({
      resetToken: "valid-reset-token-999",
      target: "alpha@example.com",
    });

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Account />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Account")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "ความปลอดภัย" }));

    const emailInput = screen.getByLabelText("อีเมลสำหรับรับรหัส OTP");
    expect(emailInput.value).toBe("alpha@example.com");

    const sendOtpBtn = screen.getByText("ส่งรหัส OTP");
    fireEvent.click(sendOtpBtn);

    await waitFor(() => {
      expect(api.sendForgotPasswordOtp).toHaveBeenCalledWith({
        identifier: "alpha@example.com",
        channel: "email",
      });
      expect(screen.getByText(/ส่งรหัส OTP ไปยัง/)).toBeInTheDocument();
    });

    const otpInput = screen.getByLabelText("รหัส OTP (6 หลัก)");
    fireEvent.change(otpInput, { target: { value: "123456" } });

    const submitBtn = screen.getByText("ยืนยันและเปลี่ยนรหัสผ่าน");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.verifyForgotPasswordOtp).toHaveBeenCalledWith({
        target: "alpha@example.com",
        otp: "123456",
      });
    });
  });

  test("updates user profile state when ManageAccountCard verifies email OTP", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      email: "alpha@example.com",
      isEmailVerified: false,
    });
    api.sendLinkOtp.mockResolvedValueOnce({
      target: "alpha@example.com",
      type: "email",
      demoOtp: "654321",
    });
    api.verifyLinkOtp.mockResolvedValueOnce({
      username: "streamer_alpha",
      email: "alpha@example.com",
      isEmailVerified: true,
    });

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Account />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText("คลิกเพื่อเชื่อมต่อ").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText("คลิกเพื่อเชื่อมต่อ")[0]);
    fireEvent.click(screen.getByText("ส่งรหัส OTP"));

    await waitFor(() => {
      expect(screen.getByText("ยืนยันและเชื่อมต่อ")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("ยืนยันและเชื่อมต่อ"));

    await waitFor(() => {
      expect(api.verifyLinkOtp).toHaveBeenCalledWith({
        target: "alpha@example.com",
        type: "email",
        otp: "654321",
      });
    });
  });
});
