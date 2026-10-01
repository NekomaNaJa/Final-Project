import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import DonorPage from "./DonorPage";
import Account from "./Account";
import PaymentPage from "./PaymentPage";
import NotFound from "./NotFound";

describe("Donor, Account, Payment, and NotFound Pages", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("DonorPage", () => {
    test("renders DonorPage and handles toggle test controls", () => {
      render(
        <MemoryRouter initialEntries={["/donor/JohnDoe"]}>
          <Routes>
            <Route path="/donor/:username" element={<DonorPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("JohnDoe")).toBeInTheDocument();
      expect(screen.getByText("donix.app/JohnDoe")).toBeInTheDocument();

      // Click test controls drawer
      const testControlsBtn = screen.getByRole("button", { name: /จำลองสถานะ/i });
      fireEvent.click(testControlsBtn);

      expect(screen.getByText("ทดสอบสถานะหน้า Donor")).toBeInTheDocument();

      // Toggle promptpay channel button in drawer
      const toggleButtons = screen.getAllByRole("button", { name: /เปิดอยู่/i });
      if (toggleButtons.length > 0) {
        fireEvent.click(toggleButtons[0]);
      }

      // Toggle offline
      const liveToggle = screen.getByText("🔴 LIVE (Online)");
      fireEvent.click(liveToggle);
      expect(screen.getByText("ขณะนี้ปิดรับโดเนทชั่วคราว")).toBeInTheDocument();
    });

    test("loads configuration from localStorage and submits donation", () => {
      localStorage.setItem(
        "donix_donate_config",
        JSON.stringify({
          welcomeMessage: "สวัสดีชาวโลก",
          minAmount: 50,
        })
      );
      localStorage.setItem(
        "donix_payment_config",
        JSON.stringify({
          promptpay: { enabled: true, number: "0812345678" },
          bank: { enabled: true, bankName: "SCB", accountNumber: "123", accountName: "Owner" },
          truemoney: { enabled: true, phone: "0812345678" },
        })
      );

      render(
        <MemoryRouter initialEntries={["/donor/Streamer1"]}>
          <Routes>
            <Route path="/donor/:username" element={<DonorPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("สวัสดีชาวโลก")).toBeInTheDocument();

      // Type name and message
      const nameInput = screen.getByPlaceholderText("Anonymous");
      fireEvent.change(nameInput, { target: { value: "Supporter1" } });

      const msgInput = screen.getByPlaceholderText("พิมพ์ข้อความที่ต้องการส่งถึงสตรีมเมอร์...");
      fireEvent.change(msgInput, { target: { value: "สู้ๆ นะครับ" } });

      // Switch to Bank tab and submit
      fireEvent.click(screen.getByText("ธนาคาร"));
      expect(screen.getByText("SCB")).toBeInTheDocument();

      // Upload dummy slip in bank form
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(["dummy"], "slip.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const submitBtn = screen.getByRole("button", { name: "ยืนยันการชำระเงิน" });
      fireEvent.click(submitBtn);

      // Advance timers for setTimeout in submit
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      expect(screen.getByText("ส่งการโดเนทสำเร็จแล้ว!")).toBeInTheDocument();

      // Close modal
      const closeBtn = screen.getByRole("button", { name: "ปิดหน้านี้" });
      fireEvent.click(closeBtn);
      expect(screen.queryByText("ส่งการโดเนทสำเร็จแล้ว!")).not.toBeInTheDocument();
    });
  });

  describe("Account Page", () => {
    test("renders Account page with user from token and handles logout", () => {
      const payload = btoa(JSON.stringify({ username: "Gamer123", email: "gamer@test.com" }));
      localStorage.setItem("token", `header.${payload}.signature`);

      render(
        <MemoryRouter initialEntries={["/account"]}>
          <Account />
        </MemoryRouter>
      );

      expect(screen.getAllByText("Gamer123")[0]).toBeInTheDocument();
      expect(screen.getAllByText("My Account")[0]).toBeInTheDocument();

      // Logout
      const logoutBtn = screen.getByRole("button", { name: /ออกจากระบบ/i });
      fireEvent.click(logoutBtn);
      expect(localStorage.getItem("token")).toBeNull();
    });

    test("renders Account page without token", () => {
      render(
        <MemoryRouter initialEntries={["/account"]}>
          <Account />
        </MemoryRouter>
      );

      expect(screen.getAllByText("Streamer")[0]).toBeInTheDocument();
    });
  });

  describe("PaymentPage", () => {
    test("renders PaymentPage and handles saving config for all cards", () => {
      const payload = btoa(JSON.stringify({ username: "StreamerPay", email: "pay@test.com" }));
      localStorage.setItem("token", `header.${payload}.signature`);

      const { container } = render(
        <MemoryRouter initialEntries={["/payment"]}>
          <PaymentPage />
        </MemoryRouter>
      );

      expect(screen.getAllByText("บัญชีรับเงิน")[0]).toBeInTheDocument();
      expect(screen.getByText("พร้อมเพย์")).toBeInTheDocument();
      expect(screen.getByText("ทรูมันนี่")).toBeInTheDocument();
      expect(screen.getByText("ธนาคาร")).toBeInTheDocument();

      // Expand all 3 cards by clicking their manage buttons
      const manageButtons = screen.getAllByText(/จัดการ/i);
      manageButtons.forEach((btn) => fireEvent.click(btn));

      // Click each card's submit button to trigger handleSave
      const submitButtons = container.querySelectorAll('button[type="submit"]');
      submitButtons.forEach((btn) => fireEvent.click(btn));

      // Verify localStorage was updated
      const saved = JSON.parse(localStorage.getItem("donix_payment_config"));
      expect(saved).toBeDefined();
      expect(saved.promptpay).toBeDefined();
      expect(saved.truemoney).toBeDefined();
      expect(saved.bank).toBeDefined();

      // Test logout on payment page
      const logoutBtn = screen.getByRole("button", { name: /ออกจากระบบ/i });
      fireEvent.click(logoutBtn);
      expect(localStorage.getItem("token")).toBeNull();
    });
  });

  describe("NotFound Page", () => {
    test("renders 404 page with return link", () => {
      render(
        <MemoryRouter initialEntries={["/random-not-found"]}>
          <NotFound />
        </MemoryRouter>
      );

      expect(screen.getByText("404")).toBeInTheDocument();
      expect(screen.getByText("ไม่พบหน้าที่คุณกำลังมองหา")).toBeInTheDocument();
      expect(screen.getByText("กลับหน้าแรก")).toBeInTheDocument();
    });
  });
});
