const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AccountProfileCard from "./AccountProfileCard";
import AccountTabs from "./AccountTabs";
import ManageAccountCard from "./ManageAccountCard";
import SecurityTab from "./SecurityTab";
import SocialMediaTab from "./SocialMediaTab";
import UserInfoTab from "./UserInfoTab";
import { sendLinkOtp, verifyLinkOtp, sendForgotPasswordOtp, verifyForgotPasswordOtp } from "../../utils/api";

jest.mock("../../utils/api", () => ({
  ...jest.requireActual("../../utils/api"),
  sendLinkOtp: jest.fn().mockResolvedValue({ target: "user@test.com", type: "email" }),
  verifyLinkOtp: jest.fn().mockResolvedValue({ email: "user@test.com", isEmailVerified: true }),
  sendForgotPasswordOtp: jest.fn().mockResolvedValue({ target: "test@example.com", maskedTarget: "t***@example.com" }),
  verifyForgotPasswordOtp: jest.fn().mockResolvedValue({ resetToken: "mock-reset-token-123" }),
}));

describe("Account Components", () => {
  beforeEach(() => {
    sendLinkOtp.mockResolvedValue({ target: "user@test.com", type: "email" });
    verifyLinkOtp.mockResolvedValue({ email: "user@test.com", isEmailVerified: true });
    sendForgotPasswordOtp.mockResolvedValue({ target: "test@example.com", maskedTarget: "t***@example.com" });
    verifyForgotPasswordOtp.mockResolvedValue({ resetToken: "mock-reset-token-123" });
    mockNavigate.mockClear();
  });

  const mockUser = {
    username: "TestStreamer",
    email: "test@example.com",
    joinedAt: "2026-01-01",
    age: "25",
    followers: 1200,
  };

  describe("AccountProfileCard", () => {
    test("renders user profile info and handles copy", () => {
      render(<AccountProfileCard user={mockUser} />);
      expect(screen.getByText("TestStreamer")).toBeInTheDocument();
      expect(screen.getByText("https://final-project-orpin-five.vercel.app/TestStreamer")).toBeInTheDocument();
      expect(screen.getByText("2026-01-01")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("1200")).toBeInTheDocument();

      const copyBtn = screen.getByTitle("คัดลอกลิงก์");
      fireEvent.click(copyBtn);
      expect(document.querySelector(".lucide-check")).toBeInTheDocument();
    });

    test("renders fallback values when user is not provided", () => {
      render(<AccountProfileCard user={null} />);
      expect(screen.getByText("Test")).toBeInTheDocument();
      expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    });

    test("triggers file input click when pencil button or avatar is clicked", () => {
      render(<AccountProfileCard user={mockUser} />);
      const fileInput = screen.getByLabelText("อัปโหลดรูปโปรไฟล์");
      const clickSpy = jest.spyOn(fileInput, "click");

      const pencilBtn = screen.getByLabelText("เปลี่ยนรูปโปรไฟล์");
      fireEvent.click(pencilBtn);
      expect(clickSpy).toHaveBeenCalledTimes(1);

      const avatarBtn = screen.getByLabelText("คลิกเพื่อเปลี่ยนรูปโปรไฟล์");
      fireEvent.click(avatarBtn);
      expect(clickSpy).toHaveBeenCalledTimes(2);

      fireEvent.keyDown(avatarBtn, { key: "Enter" });
      expect(clickSpy).toHaveBeenCalledTimes(3);
    });

    test("successfully uploads and saves avatar when valid image file is selected", async () => {
      const mockOnSave = jest.fn().mockResolvedValue({ success: true });
      render(<AccountProfileCard user={mockUser} onSave={mockOnSave} />);

      const fileInput = screen.getByLabelText("อัปโหลดรูปโปรไฟล์");
      const file = new File(["dummy content"], "avatar.png", { type: "image/png" });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          avatar: "data:image/png;base64,mock-slip-base64",
        });
      });
    });

    test("shows error when selected file type is not supported", () => {
      const mockOnSave = jest.fn();
      render(<AccountProfileCard user={mockUser} onSave={mockOnSave} />);

      const fileInput = screen.getByLabelText("อัปโหลดรูปโปรไฟล์");
      const file = new File(["dummy text"], "document.pdf", { type: "application/pdf" });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByRole("alert")).toHaveTextContent(
        "รองรับเฉพาะไฟล์รูปภาพประเภท JPG, PNG, GIF หรือ WEBP"
      );
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test("shows error when selected image exceeds size limit of 3MB", () => {
      const mockOnSave = jest.fn();
      render(<AccountProfileCard user={mockUser} onSave={mockOnSave} />);

      const fileInput = screen.getByLabelText("อัปโหลดรูปโปรไฟล์");
      const bigFile = new File(["a".repeat(100)], "large.png", {
        type: "image/png",
      });
      Object.defineProperty(bigFile, "size", { value: 4 * 1024 * 1024 });

      fireEvent.change(fileInput, { target: { files: [bigFile] } });

      expect(screen.getByRole("alert")).toHaveTextContent(
        "ขนาดไฟล์รูปภาพต้องไม่เกิน 3 MB เพื่อการแสดงผลที่รวดเร็ว"
      );
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test("allows removing avatar when user already has an avatar", async () => {
      const mockOnSave = jest.fn().mockResolvedValue({ success: true });
      const userWithAvatar = {
        ...mockUser,
        avatar: "https://example.com/avatar.jpg",
      };

      render(<AccountProfileCard user={userWithAvatar} onSave={mockOnSave} />);

      const deleteBtn = screen.getByLabelText("ลบรูปโปรไฟล์");
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({ avatar: "" });
      });
    });
  });

  describe("AccountTabs", () => {
    test("switches between tabs properly", () => {
      render(<AccountTabs user={mockUser} />);
      expect(screen.getAllByText("โซเชียลมีเดีย")[0]).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "ข้อมูลผู้ใช้งาน" }));
      expect(screen.getByText("USER INFORMATION")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "ความปลอดภัย" }));
      expect(screen.getByText("SECURITY")).toBeInTheDocument();
    });
  });

  describe("ManageAccountCard", () => {
    test("renders connected accounts list and status", () => {
      render(<ManageAccountCard />);
      expect(screen.getByText("จัดการบัญชี")).toBeInTheDocument();
      expect(screen.getByText("MANAGE ACCOUNT")).toBeInTheDocument();
      expect(screen.getAllByText("ยืนยันแล้ว").length).toBeGreaterThan(0);
      expect(screen.getAllByText("คลิกเพื่อเชื่อมต่อ").length).toBeGreaterThan(0);
    });

    test("opens OTP modal and handles send OTP and verify OTP", async () => {
      const mockOnUpdateUser = jest.fn();
      render(<ManageAccountCard user={{ email: "user@test.com", isEmailVerified: false }} onUpdateUser={mockOnUpdateUser} />);

      const connectBtns = screen.getAllByText("คลิกเพื่อเชื่อมต่อ");
      fireEvent.click(connectBtns[0]);

      expect(screen.getByText("เชื่อมต่อและยืนยันอีเมล")).toBeInTheDocument();

      const sendOtpBtn = screen.getByText("ส่งรหัส OTP");
      fireEvent.click(sendOtpBtn);

      await waitFor(() => {
        expect(screen.getByText(/รหัส OTP 6 หลัก/i)).toBeInTheDocument();
      });

      const otpInput = screen.getByPlaceholderText("123456");
      fireEvent.change(otpInput, { target: { value: "654321" } });
      expect(otpInput.value).toBe("654321");

      const verifyBtn = screen.getByText("ยืนยันและเชื่อมต่อ");
      fireEvent.click(verifyBtn);

      await waitFor(() => {
        expect(screen.getByText("เชื่อมต่อและยืนยันสำเร็จแล้ว")).toBeInTheDocument();
      });
      expect(mockOnUpdateUser).toHaveBeenCalled();
    });

    test("shows validation error when sending OTP with empty email", () => {
      render(<ManageAccountCard user={{ email: "", isEmailVerified: false }} />);
      fireEvent.click(screen.getAllByText("คลิกเพื่อเชื่อมต่อ")[0]);

      const form = screen.getByPlaceholderText("example@mail.com").closest("form");
      fireEvent.submit(form);
      expect(screen.getByText("กรุณากรอกอีเมล")).toBeInTheDocument();
    });

    test("shows error message when sendLinkOtp fails", async () => {
      sendLinkOtp.mockRejectedValueOnce(new Error("ส่งอีเมลล้มเหลว"));
      render(<ManageAccountCard user={{ email: "user@test.com", isEmailVerified: false }} />);
      fireEvent.click(screen.getAllByText("คลิกเพื่อเชื่อมต่อ")[0]);
      fireEvent.change(screen.getByPlaceholderText("example@mail.com"), {
        target: { value: "new@test.com" },
      });
      fireEvent.click(screen.getByText("ส่งรหัส OTP"));

      await waitFor(() => {
        expect(screen.getByText("ส่งอีเมลล้มเหลว")).toBeInTheDocument();
      });
    });

    test("phone flow: opens phone modal and validates empty phone", () => {
      render(<ManageAccountCard />);
      fireEvent.click(screen.getAllByText("คลิกเพื่อเชื่อมต่อ")[0]);
      expect(screen.getByText("เชื่อมต่อและยืนยันเบอร์โทรศัพท์")).toBeInTheDocument();

      const form = screen.getByPlaceholderText("0812345678").closest("form");
      fireEvent.submit(form);
      expect(screen.getByText("กรุณากรอกเบอร์โทรศัพท์")).toBeInTheDocument();
    });

    test("shows validation error when OTP is not 6 digits", async () => {
      render(<ManageAccountCard user={{ email: "user@test.com", isEmailVerified: false }} />);
      fireEvent.click(screen.getAllByText("คลิกเพื่อเชื่อมต่อ")[0]);
      fireEvent.change(screen.getByPlaceholderText("example@mail.com"), {
        target: { value: "user@test.com" },
      });
      fireEvent.click(screen.getByText("ส่งรหัส OTP"));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("123456")).toBeInTheDocument();
      });

      fireEvent.submit(screen.getByPlaceholderText("123456").closest("form"));
      expect(screen.getByText("กรุณากรอกรหัส OTP ให้ครบ 6 หลัก")).toBeInTheDocument();
    });

    test("shows error message when verifyLinkOtp fails", async () => {
      verifyLinkOtp.mockRejectedValueOnce(new Error("รหัส OTP ไม่ถูกต้องหรือหมดอายุ"));
      render(<ManageAccountCard user={{ email: "user@test.com", isEmailVerified: false }} />);
      fireEvent.click(screen.getAllByText("คลิกเพื่อเชื่อมต่อ")[0]);
      fireEvent.change(screen.getByPlaceholderText("example@mail.com"), {
        target: { value: "user@test.com" },
      });
      fireEvent.click(screen.getByText("ส่งรหัส OTP"));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("123456")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText("123456"), { target: { value: "654321" } });
      fireEvent.click(screen.getByText("ยืนยันและเชื่อมต่อ"));

      await waitFor(() => {
        expect(screen.getByText("รหัส OTP ไม่ถูกต้องหรือหมดอายุ")).toBeInTheDocument();
      });
    });

    test("closes the modal when ยกเลิก is clicked", () => {
      render(<ManageAccountCard user={{ email: "user@test.com", isEmailVerified: false }} />);
      fireEvent.click(screen.getAllByText("คลิกเพื่อเชื่อมต่อ")[0]);
      expect(screen.getByText("เชื่อมต่อและยืนยันอีเมล")).toBeInTheDocument();

      fireEvent.click(screen.getByText("ยกเลิก"));
      expect(screen.queryByText("เชื่อมต่อและยืนยันอีเมล")).not.toBeInTheDocument();
    });

    test("goes back to step 1 via เปลี่ยนข้อมูล", async () => {
      render(<ManageAccountCard user={{ email: "user@test.com", isEmailVerified: false }} />);
      fireEvent.click(screen.getAllByText("คลิกเพื่อเชื่อมต่อ")[0]);
      fireEvent.change(screen.getByPlaceholderText("example@mail.com"), {
        target: { value: "user@test.com" },
      });
      fireEvent.click(screen.getByText("ส่งรหัส OTP"));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("123456")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("เปลี่ยนข้อมูล"));
      expect(screen.getByPlaceholderText("example@mail.com")).toBeInTheDocument();
    });

    test("allows resending OTP after countdown expires", async () => {
      jest.useFakeTimers();
      try {
        render(<ManageAccountCard user={{ email: "user@test.com", isEmailVerified: false }} />);
        fireEvent.click(screen.getAllByText("คลิกเพื่อเชื่อมต่อ")[0]);
        fireEvent.change(screen.getByPlaceholderText("example@mail.com"), {
          target: { value: "user@test.com" },
        });

        await act(async () => {
          fireEvent.click(screen.getByText("ส่งรหัส OTP"));
        });
        expect(screen.getByText(/ขอรหัสใหม่ได้ใน/)).toBeInTheDocument();

        for (let i = 0; i < 60; i += 1) {
          await act(async () => {
            jest.advanceTimersByTime(1000);
          });
        }

        expect(screen.getByText("ส่งรหัสอีกครั้ง")).toBeInTheDocument();

        await act(async () => {
          fireEvent.click(screen.getByText("ส่งรหัสอีกครั้ง"));
        });

        expect(sendLinkOtp).toHaveBeenCalledTimes(2);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe("SecurityTab", () => {
    test("allows entering email, sending OTP, verifying OTP, and redirecting to /forgot-password", async () => {
      render(
        <MemoryRouter>
          <SecurityTab user={mockUser} navigate={mockNavigate} />
        </MemoryRouter>
      );
      expect(screen.getByText("SECURITY")).toBeInTheDocument();

      const emailInput = screen.getByLabelText("อีเมลสำหรับรับรหัส OTP");
      expect(emailInput.value).toBe("test@example.com");

      const sendOtpBtn = screen.getByText("ส่งรหัส OTP");
      fireEvent.click(sendOtpBtn);

      await waitFor(() => {
        expect(sendForgotPasswordOtp).toHaveBeenCalledWith({
          identifier: "test@example.com",
          channel: "email",
        });
        expect(screen.getByText(/ส่งรหัส OTP ไปยัง/)).toBeInTheDocument();
      });

      const otpInput = screen.getByLabelText("รหัส OTP (6 หลัก)");
      fireEvent.change(otpInput, { target: { value: "123456" } });
      expect(otpInput.value).toBe("123456");

      const submitBtn = screen.getByText("ยืนยันและเปลี่ยนรหัสผ่าน");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(verifyForgotPasswordOtp).toHaveBeenCalledWith({
          target: "test@example.com",
          otp: "123456",
        });
        expect(mockNavigate).toHaveBeenCalledWith("/forgot-password", {
          state: {
            step: 3,
            resetToken: "mock-reset-token-123",
            target: "test@example.com",
            identifier: "test@example.com",
          },
        });
      });
    });

    test("shows validation errors for empty email or missing OTP", () => {
      render(
        <MemoryRouter>
          <SecurityTab user={{ email: "" }} />
        </MemoryRouter>
      );

      const submitBtn = screen.getByText("ยืนยันและเปลี่ยนรหัสผ่าน");
      fireEvent.click(submitBtn);
      expect(screen.getByText("กรุณากรอกอีเมลสำหรับรับรหัส OTP")).toBeInTheDocument();

      const sendOtpBtn = screen.getByText("ส่งรหัส OTP");
      fireEvent.click(sendOtpBtn);
      expect(screen.getByText("กรุณากรอกอีเมลสำหรับรับรหัส OTP")).toBeInTheDocument();
    });

    test("shows error when verifyForgotPasswordOtp fails", async () => {
      verifyForgotPasswordOtp.mockRejectedValueOnce(new Error("รหัส OTP ไม่ถูกต้องหรือหมดอายุ"));
      render(
        <MemoryRouter>
          <SecurityTab user={mockUser} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText("ส่งรหัส OTP"));
      await waitFor(() => {
        expect(screen.getByText(/ส่งรหัส OTP ไปยัง/)).toBeInTheDocument();
      });

      const otpInput = screen.getByLabelText("รหัส OTP (6 หลัก)");
      fireEvent.change(otpInput, { target: { value: "654321" } });

      fireEvent.click(screen.getByText("ยืนยันและเปลี่ยนรหัสผ่าน"));

      await waitFor(() => {
        expect(screen.getByText("รหัส OTP ไม่ถูกต้องหรือหมดอายุ")).toBeInTheDocument();
      });
    });
  });

  describe("SocialMediaTab", () => {
    test("allows updating social link inputs and saving", () => {
      render(<SocialMediaTab />);
      expect(screen.getByText("SOCIAL MEDIA")).toBeInTheDocument();

      const inputs = screen.getAllByPlaceholderText("ยังไม่ได้เชื่อมต่อ");
      fireEvent.change(inputs[0], { target: { value: "https://facebook.com/streamer" } });
      expect(inputs[0].value).toBe("https://facebook.com/streamer");

      const saveBtn = screen.getByRole("button", { name: /บันทึก/i });
      fireEvent.click(saveBtn);
    });
  });

  describe("UserInfoTab", () => {
    test("renders form with user fields and allows input changes", () => {
      render(<UserInfoTab user={mockUser} />);
      expect(screen.getByText("USER INFORMATION")).toBeInTheDocument();

      const nicknameInput = screen.getByPlaceholderText("Test");
      expect(nicknameInput.value).toBe("TestStreamer");

      const fullNameInput = screen.getByPlaceholderText("ชื่อ - นามสกุล");
      fireEvent.change(fullNameInput, { target: { name: "fullName", value: "สมชาย ทดสอบ" } });
      expect(fullNameInput.value).toBe("สมชาย ทดสอบ");

      const genderSelect = screen.getByRole("combobox");
      fireEvent.change(genderSelect, { target: { name: "gender", value: "male" } });
      expect(genderSelect.value).toBe("male");

      const saveBtn = screen.getByRole("button", { name: /บันทึก/i });
      fireEvent.click(saveBtn);
    });
  });
});
