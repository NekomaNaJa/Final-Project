import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AccountProfileCard from "./AccountProfileCard";
import AccountTabs from "./AccountTabs";
import ManageAccountCard from "./ManageAccountCard";
import SecurityTab from "./SecurityTab";
import SocialMediaTab from "./SocialMediaTab";
import UserInfoTab from "./UserInfoTab";

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
      expect(screen.getByText("donix.app/TestStreamer")).toBeInTheDocument();
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
