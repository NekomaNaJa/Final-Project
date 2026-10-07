import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PaymentPage from "./PaymentPage";
import * as api from "../utils/api";

jest.mock("../utils/api", () => {
  const original = jest.requireActual("../utils/api");
  return {
    ...original,
    fetchCurrentUser: jest.fn(),
    updatePaymentSettings: jest.fn(),
  };
});

describe("PaymentPage Integration", () => {
  const validPayload = btoa(JSON.stringify({ userId: "123", username: "streamer_omega" }));
  const validToken = `header.${validPayload}.signature`;

  const mockPaymentConfig = {
    promptpay: { enabled: true, type: "เบอร์โทรศัพท์", number: "0812345678" },
    bank: {
      enabled: true,
      bankName: "ธนาคารไทยพาณิชย์ (SCB)",
      accountNumber: "1234567890",
      accountName: "นาย สมชาย",
    },
    truemoney: { enabled: false, phone: "0899999999" },
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("redirects to /login when token does not exist", async () => {
    render(
      <MemoryRouter initialEntries={["/payment"]}>
        <Routes>
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/login" element={<div>หน้าล็อกอิน</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("หน้าล็อกอิน")).toBeInTheDocument();
    });
  });

  test("redirects to /login when token is malformed", async () => {
    localStorage.setItem("token", "corrupt.token");

    render(
      <MemoryRouter initialEntries={["/payment"]}>
        <Routes>
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/login" element={<div>หน้าล็อกอิน</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("หน้าล็อกอิน")).toBeInTheDocument();
    });
  });

  test("loads user payment data on mount from fetchCurrentUser", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_omega",
      payment: mockPaymentConfig,
    });

    render(
      <MemoryRouter initialEntries={["/payment"]}>
        <Routes>
          <Route path="/payment" element={<PaymentPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("พร้อมเพย์")).toBeInTheDocument();
      expect(screen.getByText("ทรูมันนี่")).toBeInTheDocument();
      expect(screen.getByText("ธนาคาร")).toBeInTheDocument();
    });
  });

  test("saves PromptPay successfully and shows feedback toast", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_omega",
      payment: mockPaymentConfig,
    });
    api.updatePaymentSettings.mockResolvedValueOnce({
      ...mockPaymentConfig,
      promptpay: { enabled: true, type: "เบอร์โทรศัพท์", number: "0812345678" },
    });

    render(
      <MemoryRouter initialEntries={["/payment"]}>
        <Routes>
          <Route path="/payment" element={<PaymentPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("พร้อมเพย์")).toBeInTheDocument();
    });

    // Expand promptpay card
    const expandButtons = screen.getAllByText(/จัดการ/i);
    fireEvent.click(expandButtons[0]);

    // Submit PromptPay
    const saveButton = screen.getByRole("button", { name: "บันทึก" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(api.updatePaymentSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          promptpay: expect.objectContaining({
            enabled: true,
            type: "เบอร์โทรศัพท์",
            number: "0812345678",
          }),
        })
      );
      expect(screen.getByText("บันทึกข้อมูลพร้อมเพย์สำเร็จ")).toBeInTheDocument();
    });
  });

  test("handles error when saving PromptPay fails", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_omega",
      payment: mockPaymentConfig,
    });
    api.updatePaymentSettings.mockRejectedValueOnce(new Error("เซิร์ฟเวอร์ขัดข้อง"));

    render(
      <MemoryRouter initialEntries={["/payment"]}>
        <Routes>
          <Route path="/payment" element={<PaymentPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("พร้อมเพย์")).toBeInTheDocument();
    });

    const expandButtons = screen.getAllByText(/จัดการ/i);
    fireEvent.click(expandButtons[0]);

    const saveButton = screen.getByRole("button", { name: "บันทึก" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("เซิร์ฟเวอร์ขัดข้อง")).toBeInTheDocument();
    });
  });

  test("saves TrueMoney successfully and shows feedback toast", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_omega",
      payment: mockPaymentConfig,
    });
    api.updatePaymentSettings.mockResolvedValueOnce({
      ...mockPaymentConfig,
      truemoney: { enabled: true, phone: "0899999999" },
    });

    render(
      <MemoryRouter initialEntries={["/payment"]}>
        <Routes>
          <Route path="/payment" element={<PaymentPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("ทรูมันนี่")).toBeInTheDocument();
    });

    // Expand truemoney card
    const expandButtons = screen.getAllByText(/จัดการ/i);
    fireEvent.click(expandButtons[1]);

    const saveButton = screen.getByRole("button", { name: "บันทึก" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(api.updatePaymentSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          truemoney: expect.objectContaining({
            phone: "0899999999",
          }),
        })
      );
      expect(screen.getByText("บันทึกข้อมูลทรูมันนี่สำเร็จ")).toBeInTheDocument();
    });
  });

  test("saves Bank successfully and shows feedback toast", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_omega",
      payment: mockPaymentConfig,
    });
    api.updatePaymentSettings.mockResolvedValueOnce({
      ...mockPaymentConfig,
      bank: mockPaymentConfig.bank,
    });

    render(
      <MemoryRouter initialEntries={["/payment"]}>
        <Routes>
          <Route path="/payment" element={<PaymentPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("ธนาคาร")).toBeInTheDocument();
    });

    // Expand bank card
    const expandButtons = screen.getAllByText(/จัดการ/i);
    fireEvent.click(expandButtons[2]);

    const saveButton = screen.getByRole("button", { name: "บันทึก" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(api.updatePaymentSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          bank: expect.objectContaining({
            bankName: "ธนาคารไทยพาณิชย์ (SCB)",
          }),
        })
      );
      expect(screen.getByText("บันทึกข้อมูลบัญชีธนาคารสำเร็จ")).toBeInTheDocument();
    });
  });

  test("logs out when clicking logout button in Sidebar", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_omega",
      payment: mockPaymentConfig,
    });

    render(
      <MemoryRouter initialEntries={["/payment"]}>
        <Routes>
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/login" element={<div>ออกจากระบบสำเร็จ</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("พร้อมเพย์")).toBeInTheDocument();
    });

    const logoutBtn = screen.getByText(/ออกจากระบบ/i);
    fireEvent.click(logoutBtn);

    expect(localStorage.getItem("token")).toBeNull();
    await waitFor(() => {
      expect(screen.getByText("ออกจากระบบสำเร็จ")).toBeInTheDocument();
    });
  });
});
