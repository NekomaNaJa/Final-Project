import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import AccountProfileCard from "./AccountProfileCard";
import AccountTabs from "./AccountTabs";
import ManageAccountCard from "./ManageAccountCard";
import SecurityTab from "./SecurityTab";
import SocialMediaTab from "./SocialMediaTab";
import UserInfoTab from "./UserInfoTab";
import { sendLinkOtp, verifyLinkOtp } from "../../utils/api";

jest.mock("../../utils/api", () => ({
  ...jest.requireActual("../../utils/api"),
  sendLinkOtp: jest.fn().mockResolvedValue({ target: "user@test.com", type: "email" }),
  verifyLinkOtp: jest.fn().mockResolvedValue({ email: "user@test.com", isEmailVerified: true }),
}));

describe("Account Components", () => {
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
    test("allows typing passwords and toggling password visibility", () => {
      render(<SecurityTab />);
      expect(screen.getByText("SECURITY")).toBeInTheDocument();

      const currentPassInput = screen.getAllByPlaceholderText("••••••••••••")[0];
      fireEvent.change(currentPassInput, { target: { name: "currentPassword", value: "Secret123" } });
      expect(currentPassInput.value).toBe("Secret123");

      const toggleButtons = screen.getAllByRole("button", { name: "แสดงรหัสผ่าน" });
      fireEvent.click(toggleButtons[0]);
      expect(currentPassInput.getAttribute("type")).toBe("text");

      const saveBtn = screen.getByRole("button", { name: /บันทึก/i });
      fireEvent.click(saveBtn);
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
