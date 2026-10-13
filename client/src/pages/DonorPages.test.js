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
      },
    }),
    fetchPublicStreamer: jest.fn().mockRejectedValue(new Error("API offline")),
    createDonation: jest.fn().mockResolvedValue({ id: "don123", status: "pending" }),
    updatePaymentSettings: jest.fn((payload) =>
      Promise.resolve({
        promptpay: { enabled: true, type: "เบอร์โทรศัพท์", number: "" },
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
          bank: { enabled: false, bankName: "SCB", accountNumber: "123", accountName: "Owner" },
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

      // Switch to bank tab (which is disabled)
      fireEvent.click(screen.getByText("ธนาคาร"));
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

    test("renders custom cover image, background image, and avatar when provided", async () => {
      fetchPublicStreamer.mockResolvedValueOnce({
        username: "StarStreamer",
        avatar: "https://example.com/avatar.jpg",
        donationPage: {
          welcomeMessage: "ยินดีต้อนรับสู่ห้องสตรีม",
          coverImage: "https://example.com/cover.jpg",
          backgroundImage: "https://example.com/bg.jpg",
          minAmount: 10,
        },
        payment: {
          promptpay: { enabled: true, number: "0899999999" },
        },
      });

      render(
        <MemoryRouter initialEntries={["/donor/StarStreamer"]}>
          <Routes>
            <Route path="/donor/:username" element={<DonorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId("donor-custom-background")).toBeInTheDocument();
        const coverImg = screen.getByAltText("Cover Banner");
        expect(coverImg).toHaveAttribute("src", "https://example.com/cover.jpg");
        const avatarImg = screen.getByAltText("StarStreamer");
        expect(avatarImg).toHaveAttribute("src", "https://example.com/avatar.jpg");
      });
    });

    test("displays missions from public streamer and updates amount and message when mission is selected", async () => {
      fetchPublicStreamer.mockResolvedValueOnce({
        username: "StarStreamer",
        payment: {
          promptpay: { enabled: true, number: "0899999999" },
        },
        donationPage: { minAmount: 10 },
        mission: {
          title: "ภารกิจสุดโหดวันนี้",
          missions: [
            { id: "m-1", name: "เล่นมือเดียว", price: 50 },
            { id: "m-2", name: "ร้องเพลง 1 เพลง", price: 100 },
          ],
        },
      });

      render(
        <MemoryRouter initialEntries={["/donor/StarStreamer"]}>
          <Routes>
            <Route path="/donor/:username" element={<DonorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("ภารกิจสุดโหดวันนี้")).toBeInTheDocument();
      });
      expect(screen.getByText("เล่นมือเดียว")).toBeInTheDocument();
      expect(screen.getByText("ร้องเพลง 1 เพลง")).toBeInTheDocument();

      // Click mission 1
      fireEvent.click(screen.getByText("เล่นมือเดียว"));

      // Check amount input updated to 50
      const amountInput = screen.getByRole("spinbutton");
      expect(amountInput.value).toBe("50");

      // Check locked mission badge is rendered in message container (cannot be deleted)
      expect(screen.getByTestId("locked-mission-badge")).toBeInTheDocument();
      expect(screen.getByTestId("locked-mission-badge")).toHaveTextContent("เล่นมือเดียว");

      // Type additional message
      const messageInput = screen.getByPlaceholderText(/พิมพ์ข้อความ/);
      fireEvent.change(messageInput, { target: { value: "สู้ๆ นะครับ" } });

      // Attach slip and submit donation
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(["dummy"], "slip.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const submitBtn = screen.getByRole("button", { name: "ยืนยันการชำระเงิน" });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(createDonation).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "[ภารกิจ: เล่นมือเดียว] สู้ๆ นะครับ",
            amount: 50,
          })
        );
      });

      // Click clear button when mission is selected
      const clearBtn = screen.getByTestId("clear-mission-btn");
      fireEvent.click(clearBtn);
      expect(screen.queryByTestId("locked-mission-badge")).not.toBeInTheDocument();
    });

    test("handles offline streamer correctly by showing OFFLINE badge, offline card, and disabling donations", async () => {
      fetchPublicStreamer.mockResolvedValueOnce({
        username: "OfflineStreamer",
        isLive: false,
        donationPage: {
          welcomeMessage: "ตอนนี้ออฟไลน์อยู่ครับ",
          minAmount: 10,
        },
        payment: {
          promptpay: { enabled: true, number: "0899999999" },
        },
      });

      render(
        <MemoryRouter initialEntries={["/donor/OfflineStreamer"]}>
          <Routes>
            <Route path="/donor/:username" element={<DonorPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Verify page is accessible
      expect(screen.getByText("OfflineStreamer")).toBeInTheDocument();
      expect(screen.getByText("donix.app/OfflineStreamer")).toBeInTheDocument();

      // Verify OFFLINE badge and offline status cards
      await waitFor(() => {
        expect(screen.getByText("OFFLINE")).toBeInTheDocument();
        expect(screen.getAllByText("สตรีมเมอร์ปิดรับโดเนทในขณะนี้").length).toBeGreaterThan(0);
        expect(screen.getByText("สตรีมเมอร์ปิดรับการสนับสนุนชั่วคราว กรุณาลองใหม่อีกครั้งภายหลัง")).toBeInTheDocument();
      });

      // Verify inputs are disabled
      expect(screen.getByPlaceholderText("Anonymous")).toBeDisabled();
      expect(screen.getByPlaceholderText(/พิมพ์ข้อความ/)).toBeDisabled();

      // Verify payment submit button is NOT present
      expect(screen.queryByRole("button", { name: "ยืนยันการชำระเงิน" })).not.toBeInTheDocument();
    });

    test("displays filtered donorName from api response in submitted card", async () => {
      localStorage.setItem(
        "donix_payment_config",
        JSON.stringify({
          bank: { enabled: true, bankName: "SCB", accountNumber: "123", accountName: "Owner" },
        })
      );
      createDonation.mockResolvedValueOnce({
        data: {
          id: "don999",
          status: "approved",
          donorName: "ผู้ให้ ***",
          amount: 50,
        },
      });

      render(
        <MemoryRouter initialEntries={["/donor/Streamer1"]}>
          <Routes>
            <Route path="/donor/:username" element={<DonorPage />} />
          </Routes>
        </MemoryRouter>
      );

      const nameInput = screen.getByPlaceholderText("Anonymous");
      fireEvent.change(nameInput, { target: { value: "ผู้ให้ คำหยาบ" } });

      fireEvent.click(screen.getByText("ธนาคาร"));
      expect(screen.getByText("SCB")).toBeInTheDocument();

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(["dummy"], "slip.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const submitBtn = screen.getByRole("button", { name: "ยืนยันการชำระเงิน" });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText("ส่งการโดเนทสำเร็จแล้ว!")).toBeInTheDocument();
        expect(screen.getByText("ผู้ให้ ***")).toBeInTheDocument();
      });
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

    test("displays processing modal while donation submission is pending", async () => {
      let resolveSubmission;
      const pendingPromise = new Promise((resolve) => {
        resolveSubmission = resolve;
      });
      createDonation.mockImplementationOnce(() => pendingPromise);

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

      // Verify processing dialog is visible and shows "กำลังดำเนินการ"
      expect(
        screen.getByRole("dialog", { name: "กำลังดำเนินการ" })
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "ระบบกำลังตรวจสอบข้อมูลและสลิปการโอนเงิน กรุณารอสักครู่..."
        )
      ).toBeInTheDocument();

      // Resolve the submission
      await act(async () => {
        resolveSubmission({ id: "don999", status: "approved", amount: 100 });
      });

      // Dialog should now be replaced by success modal
      await waitFor(() => {
        expect(
          screen.queryByRole("dialog", { name: "กำลังดำเนินการ" })
        ).not.toBeInTheDocument();
        expect(screen.getByText("ส่งการโดเนทสำเร็จแล้ว!")).toBeInTheDocument();
      });
    });

    test("ignores repeated donation submissions while in flight", async () => {
      let resolveSubmission;
      const pendingPromise = new Promise((resolve) => {
        resolveSubmission = resolve;
      });
      createDonation.mockImplementationOnce(() => pendingPromise);

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
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(createDonation).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        resolveSubmission({ id: "don999", status: "approved", amount: 100 });
      });

      await waitFor(() => {
        expect(screen.getByText("ส่งการโดเนทสำเร็จแล้ว!")).toBeInTheDocument();
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
      expect(screen.getByText("ธนาคาร")).toBeInTheDocument();

      // Expand both cards by clicking their manage buttons
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
