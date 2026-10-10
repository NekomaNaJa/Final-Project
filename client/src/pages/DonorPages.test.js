import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import DonorPage from "./DonorPage";
import Account from "./Account";
import PaymentPage from "./PaymentPage";
import NotFound from "./NotFound";

import { fetchPublicStreamer, createDonation } from "../utils/api";

jest.mock("../utils/api", () => {
  const original = jest.requireActual("../utils/api");
  return {
    ...original,
    fetchCurrentUser: jest.fn().mockResolvedValue({
      payment: {
        promptpay: { enabled: true, type: "เบอร์โทรศัพท์", number: "" },
        bank: { enabled: true, bankName: "ธนาคารไทยพาณิชย์ (SCB)", accountNumber: "", accountName: "" },
        truemoney: { enabled: true, phone: "" },
      },
    }),
    fetchPublicStreamer: jest.fn().mockRejectedValue(new Error("API offline")),
    createDonation: jest.fn().mockResolvedValue({ id: "don123", status: "pending" }),
    updatePaymentSettings: jest.fn((payload) =>
      Promise.resolve({
        promptpay: { enabled: true, type: "เบอร์โทรศัพท์", number: "" },
        truemoney: { enabled: true, phone: "" },
        bank: { enabled: true, bankName: "ธนาคารไทยพาณิชย์ (SCB)", accountNumber: "", accountName: "" },
        ...payload,
      })
    ),
  };
});

describe("Donor, Account, Payment, and NotFound Pages", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
    fetchPublicStreamer.mockImplementation(() => Promise.reject(new Error("offline")));
    createDonation.mockImplementation(() => Promise.resolve({ id: "don123" }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("DonorPage", () => {
    test("renders DonorPage and displays disabled card when channel is not enabled in settings", () => {
      localStorage.setItem(
        "donix_payment_config",
        JSON.stringify({
          promptpay: { enabled: true, number: "0812345678" },
          bank: { enabled: true, bankName: "SCB", accountNumber: "123", accountName: "Owner" },
          truemoney: { enabled: false, phone: "" },
        })
      );

      render(
        <MemoryRouter initialEntries={["/donor/JohnDoe"]}>
          <Routes>
            <Route path="/donor/:username" element={<DonorPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("JohnDoe")).toBeInTheDocument();
      expect(screen.getByText("donix.app/JohnDoe")).toBeInTheDocument();

      // Switch to truemoney tab (which is disabled)
      fireEvent.click(screen.getByText("ทรูมันนี่"));
      expect(screen.getByText("ไม่พร้อมให้บริการ")).toBeInTheDocument();
      expect(
        screen.getByText(
          "สตรีมเมอร์ไม่ได้เปิดใช้งานช่องทางการชำระเงินนี้ กรุณาเลือกช่องทางอื่น"
        )
      ).toBeInTheDocument();

      // Switch back to promptpay tab (which is enabled)
      fireEvent.click(screen.getByText("พร้อมเพย์"));
      expect(
        screen.queryByText("ไม่พร้อมให้บริการ")
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "ยืนยันการชำระเงิน" })
      ).toBeInTheDocument();
    });

    test("loads configuration from localStorage and submits donation", async () => {
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

      await waitFor(() => {
        expect(screen.getByText("ส่งการโดเนทสำเร็จแล้ว!")).toBeInTheDocument();
      });

      // Spy on window.location.reload
      const originalLocation = window.location;
      const reloadMock = jest.fn();
      delete window.location;
      window.location = { ...originalLocation, reload: reloadMock };

      // Close modal
      const closeBtn = screen.getByRole("button", { name: "ปิดหน้านี้" });
      fireEvent.click(closeBtn);
      expect(screen.queryByText("ส่งการโดเนทสำเร็จแล้ว!")).not.toBeInTheDocument();
      expect(reloadMock).toHaveBeenCalled();

      window.location = originalLocation;
    });

    test("shows streamer not found status alert when streamer is not found", async () => {
      fetchPublicStreamer.mockRejectedValueOnce(new Error("ไม่พบสตรีมเมอร์นี้"));

      render(
        <MemoryRouter initialEntries={["/donor/GhostStreamer"]}>
          <Routes>
            <Route path="/donor/:username" element={<DonorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toHaveTextContent(
          'ไม่พบบัญชีสตรีมเมอร์ "GhostStreamer" ในระบบ กำลังแสดงหน้าจำลอง'
        );
      });
    });

    test("shows error feedback alert when donation submission fails with specific error", async () => {
      createDonation.mockRejectedValueOnce(
        new Error("ช่องทางการชำระเงินนี้ไม่พร้อมให้บริการ")
      );

      render(
        <MemoryRouter initialEntries={["/donor/Streamer1"]}>
          <Routes>
            <Route path="/donor/:username" element={<DonorPage />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText("ธนาคาร"));
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(["dummy"], "slip.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const submitBtn = screen.getByRole("button", { name: "ยืนยันการชำระเงิน" });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "ช่องทางการชำระเงินนี้ไม่พร้อมให้บริการ"
        );
      });

      expect(screen.queryByText("ส่งการโดเนทสำเร็จแล้ว!")).not.toBeInTheDocument();
    });

    test("shows fallback error alert when donation fails without error message", async () => {
      createDonation.mockRejectedValueOnce({});

      render(
        <MemoryRouter initialEntries={["/donor/Streamer1"]}>
          <Routes>
            <Route path="/donor/:username" element={<DonorPage />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText("ธนาคาร"));
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(["dummy"], "slip.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const submitBtn = screen.getByRole("button", { name: "ยืนยันการชำระเงิน" });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "เกิดข้อผิดพลาดในการส่งข้อมูลการโดเนท"
        );
      });
    });

    test("submits donation successfully with API _id and displays pending status and anonymous donor, then resets fields on modal close", async () => {
      createDonation.mockResolvedValueOnce({
        _id: "mongo_id_777",
        status: "pending",
      });

      render(
        <MemoryRouter initialEntries={["/donor/Streamer1"]}>
          <Routes>
            <Route path="/donor/:username" element={<DonorPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Clear donor name to test "Anonymous" fallback in submission and modal
      const nameInput = screen.getByPlaceholderText("Anonymous");
      fireEvent.change(nameInput, { target: { value: "" } });

      fireEvent.click(screen.getByText("ธนาคาร"));
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(["dummy"], "slip.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const submitBtn = screen.getByRole("button", { name: "ยืนยันการชำระเงิน" });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText("ส่งการโดเนทสำเร็จแล้ว!")).toBeInTheDocument();
      });

      expect(screen.getByText("รอสตรีมเมอร์ตรวจสอบสลิป (Pending)")).toBeInTheDocument();
      expect(screen.getByText("Anonymous")).toBeInTheDocument();

      // Close modal and verify it closes
      const closeBtn = screen.getByRole("button", { name: "ปิดหน้านี้" });
      fireEvent.click(closeBtn);
      expect(screen.queryByText("ส่งการโดเนทสำเร็จแล้ว!")).not.toBeInTheDocument();
    });

    test("submits donation and displays auto-approved status and transRef when slip is verified by OCR", async () => {
      createDonation.mockResolvedValueOnce({
        id: "don_approved_999",
        status: "approved",
        transRef: "REF_AUTO_APPROVE_888",
      });

      render(
        <MemoryRouter initialEntries={["/donor/Streamer1"]}>
          <Routes>
            <Route path="/donor/:username" element={<DonorPage />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText("ธนาคาร"));
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(["dummy"], "slip.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const submitBtn = screen.getByRole("button", { name: "ยืนยันการชำระเงิน" });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText("ส่งการโดเนทสำเร็จแล้ว!")).toBeInTheDocument();
      });

      expect(
        screen.getByText("✓ ตรวจสอบสลิปและอนุมัติสำเร็จ (Approved)")
      ).toBeInTheDocument();
      expect(screen.getByText("REF_AUTO_APPROVE_888")).toBeInTheDocument();
    });

    test("loads streamer data from fetchPublicStreamer and updates state", async () => {
      fetchPublicStreamer.mockResolvedValueOnce({
        username: "ApiStreamer",
        isLive: true,
        donationPage: {
          welcomeMessage: "ข้อความจาก API เซิร์ฟเวอร์",
          thankYouMessage: "ขอบคุณจากใจจริง",
          minAmount: 25,
          charLimit: 120,
        },
        payment: {
          promptpay: { enabled: true, number: "0999999999" },
          bank: { enabled: true, bankName: "ธนาคารไทยพาณิชย์ (SCB)", accountNumber: "999", accountName: "Owner" },
          truemoney: { enabled: false },
        },
      });

      render(
        <MemoryRouter initialEntries={["/donor/ApiStreamer"]}>
          <Routes>
            <Route path="/donor/:username" element={<DonorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("ข้อความจาก API เซิร์ฟเวอร์")).toBeInTheDocument();
      });
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
    test("renders PaymentPage and handles saving config for all cards", async () => {
      jest.useRealTimers();
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
      await waitFor(() => {
        const saved = JSON.parse(localStorage.getItem("donix_payment_config"));
        expect(saved).toBeDefined();
        expect(saved.promptpay).toBeDefined();
        expect(saved.truemoney).toBeDefined();
        expect(saved.bank).toBeDefined();
      });

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
