import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ForgotPassword from "./ForgotPassword";
import * as api from "../utils/api";

jest.mock("../utils/api", () => {
  const original = jest.requireActual("../utils/api");
  return {
    ...original,
    sendForgotPasswordOtp: jest.fn(),
    verifyForgotPasswordOtp: jest.fn(),
    resetForgotPassword: jest.fn(),
  };
});

describe("ForgotPassword Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders step 1 and allows toggling between Email and SMS channels", () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    expect(screen.getByText("ลืมรหัสผ่าน")).toBeInTheDocument();
    expect(screen.getByText("ส่งไปที่อีเมล")).toBeInTheDocument();
    expect(screen.getByText("ส่งผ่าน SMS")).toBeInTheDocument();

    const smsBtn = screen.getByText("ส่งผ่าน SMS");
    fireEvent.click(smsBtn);
    expect(screen.getByPlaceholderText("0812345678")).toBeInTheDocument();

    const emailBtn = screen.getByText("ส่งไปที่อีเมล");
    fireEvent.click(emailBtn);
    expect(screen.getByPlaceholderText("your-email@example.com")).toBeInTheDocument();
  });

  test("shows error if identifier is empty when submitting step 1", async () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole("button", { name: "ส่งรหัส OTP" });
    fireEvent.click(submitBtn);

    expect(screen.getByText("กรุณากรอกอีเมลของคุณ")).toBeInTheDocument();
  });

  test("full forgot password flow: send OTP -> verify OTP -> reset password -> success", async () => {
    api.sendForgotPasswordOtp.mockResolvedValueOnce({
      target: "test@example.com",
      maskedTarget: "t***@example.com",
    });

    api.verifyForgotPasswordOtp.mockResolvedValueOnce({
      resetToken: "mock_jwt_reset_token",
    });

    api.resetForgotPassword.mockResolvedValueOnce({
      message: "ตั้งรหัสผ่านใหม่สำเร็จแล้ว",
    });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    // Step 1: Input email & Send OTP
    const emailInput = screen.getByPlaceholderText("your-email@example.com");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "ส่งรหัส OTP" }));

    await waitFor(() => {
      expect(screen.getByText(/รหัส OTP \(6 หลัก\)/i)).toBeInTheDocument();
    });

    // Step 2: Input OTP & Verify OTP
    const otpInput = screen.getByPlaceholderText("123456");
    fireEvent.change(otpInput, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "ยืนยันรหัส OTP" }));

    await waitFor(() => {
      expect(screen.getByText("รหัสผ่านใหม่")).toBeInTheDocument();
    });

    // Step 3: Input new password & confirm password
    const passwordInputs = screen.getAllByPlaceholderText("*************");
    fireEvent.change(passwordInputs[0], { target: { value: "NewPassword123!" } });
    fireEvent.change(passwordInputs[1], { target: { value: "NewPassword123!" } });
    fireEvent.click(screen.getByRole("button", { name: "ตั้งรหัสผ่านใหม่" }));

    // Step 4: Success confirmation
    await waitFor(() => {
      expect(screen.getByText("รีเซ็ตรหัสผ่านสำเร็จ")).toBeInTheDocument();
    });
    expect(screen.getByText("ไปที่หน้าเข้าสู่ระบบ")).toBeInTheDocument();
  });

  test("shows error if passwords do not match in step 3", async () => {
    api.sendForgotPasswordOtp.mockResolvedValueOnce({
      target: "test@example.com",
      maskedTarget: "t***@example.com",
    });

    api.verifyForgotPasswordOtp.mockResolvedValueOnce({
      resetToken: "mock_jwt_reset_token",
    });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("your-email@example.com");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "ส่งรหัส OTP" }));

    await waitFor(() => {
      expect(screen.getByText(/รหัส OTP \(6 หลัก\)/i)).toBeInTheDocument();
    });

    const otpInput = screen.getByPlaceholderText("123456");
    fireEvent.change(otpInput, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "ยืนยันรหัส OTP" }));

    await waitFor(() => {
      expect(screen.getByText("รหัสผ่านใหม่")).toBeInTheDocument();
    });

    const passwordInputs = screen.getAllByPlaceholderText("*************");
    fireEvent.change(passwordInputs[0], { target: { value: "Password123!" } });
    fireEvent.change(passwordInputs[1], { target: { value: "DifferentPassword123!" } });
    fireEvent.click(screen.getByRole("button", { name: "ตั้งรหัสผ่านใหม่" }));

    expect(screen.getByText("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน")).toBeInTheDocument();
  });
});
