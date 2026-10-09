import React from "react";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import HistoryPage from "./HistoryPage";
import SlipModal from "../components/Histor/SlipModal";
import * as api from "../utils/api";

jest.mock("../utils/api", () => {
  const original = jest.requireActual("../utils/api");
  return {
    ...original,
    fetchDonationHistory: jest.fn(),
    updateDonationStatus: jest.fn(),
  };
});

describe("HistoryPage", () => {
  const validPayload = btoa(JSON.stringify({ username: "streamer_pro" }));
  const validToken = `header.${validPayload}.signature`;

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    api.fetchDonationHistory.mockResolvedValue({ donations: [], pagination: { total: 0 } });
  });

  test("redirects to login when no token", () => {
    render(
      <MemoryRouter initialEntries={["/history"]}>
        <Routes>
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/login" element={<div>เข้าสู่ระบบ</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("เข้าสู่ระบบ")).toBeInTheDocument();
  });

  test("redirects to login when token is invalid", () => {
    localStorage.setItem("token", "invalid");
    render(
      <MemoryRouter initialEntries={["/history"]}>
        <Routes>
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/login" element={<div>เข้าสู่ระบบ</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("เข้าสู่ระบบ")).toBeInTheDocument();
  });

  test("renders with valid token and shows empty state", async () => {
    localStorage.setItem("token", validToken);

    render(
      <MemoryRouter initialEntries={["/history"]}>
        <HistoryPage />
      </MemoryRouter>
    );

    expect((await screen.findAllByText("streamer_pro")).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "ประวัติการรับเงินของ streamer_pro"
    );
    expect(screen.getAllByText("ประวัติการรับเงิน").length).toBeGreaterThan(0);
    expect(screen.getByText("ยังไม่มีประวัติการรับเงิน")).toBeInTheDocument();
  });

  test("renders history table with all statuses and pagination disabled", async () => {
    const { default: DonationHistoryTable } = await import(
      "../components/Histor/DonationHistoryTable"
    );

    const history = [
      {
        id: 1,
        time: "10:00",
        name: "Alice",
        message: "สู้ๆ",
        amount: "฿100",
        channel: "PromptPay",
        status: "สำเร็จ",
      },
      {
        id: 2,
        time: "11:00",
        name: "Bob",
        message: "keep going",
        amount: "฿50",
        channel: "Bank",
        status: "รอดำเนินการ",
      },
      {
        id: 3,
        time: "12:00",
        name: "Carol",
        message: "wow",
        amount: "฿200",
        channel: "TrueMoney",
        status: "ล้มเหลว",
      },
    ];

    render(<DonationHistoryTable history={history} />);

    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("สู้ๆ")).toBeInTheDocument();
    expect(screen.getByText("฿100")).toBeInTheDocument();
    expect(screen.getByText("PromptPay")).toBeInTheDocument();
    expect(screen.getByText("สำเร็จ")).toBeInTheDocument();

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("รอดำเนินการ")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();
    expect(screen.getByText("ล้มเหลว")).toBeInTheDocument();

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getAllByRole("button").length).toBe(2);
  });

  test("fetches donations from API and opens SlipModal on row click", async () => {
    localStorage.setItem("token", validToken);

    const mockDonations = [
      {
        _id: "don-001",
        donorName: "Supporter One",
        amount: 500,
        message: "สู้ต่อไปนะ",
        paymentMethod: "promptpay",
        status: "pending",
        slipImage: "https://example.com/slip.jpg",
        createdAt: new Date().toISOString(),
      },
    ];

    api.fetchDonationHistory.mockResolvedValue({
      donations: mockDonations,
      pagination: { total: 1, page: 1, totalPages: 1 },
    });

    render(
      <MemoryRouter initialEntries={["/history"]}>
        <HistoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Supporter One")).toBeInTheDocument();
      expect(screen.getByText("฿500")).toBeInTheDocument();
      expect(screen.getAllByText("รอตรวจสอบ").length).toBeGreaterThanOrEqual(1);
    });

    // Click row to open SlipModal
    fireEvent.click(screen.getByText("Supporter One"));

    expect(screen.getByText("หลักฐานและรายละเอียดการบริจาค")).toBeInTheDocument();
    expect(screen.getByAltText("สลิปหลักฐานการโอน")).toBeInTheDocument();
    expect(screen.getByText("อนุมัติรายการ")).toBeInTheDocument();
    expect(screen.getByText("ปฏิเสธรายการ")).toBeInTheDocument();
  });

  test("approves donation from SlipModal", async () => {
    localStorage.setItem("token", validToken);

    const mockDonations = [
      {
        _id: "don-002",
        donorName: "Supporter Two",
        amount: 300,
        message: "GG",
        paymentMethod: "bank",
        status: "pending",
        slipImage: null,
      },
    ];

    api.fetchDonationHistory.mockResolvedValue({
      donations: mockDonations,
      pagination: { total: 1, page: 1, totalPages: 1 },
    });
    api.updateDonationStatus.mockResolvedValueOnce({ _id: "don-002", status: "approved" });

    render(
      <MemoryRouter initialEntries={["/history"]}>
        <HistoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Supporter Two")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Supporter Two"));

    const approveBtn = screen.getByRole("button", { name: /อนุมัติรายการ/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(api.updateDonationStatus).toHaveBeenCalledWith("don-002", "approved");
      expect(screen.getByText("อนุมัติรายการบริจาคสำเร็จ")).toBeInTheDocument();
    });
  });

  test("rejects donation from SlipModal", async () => {
    localStorage.setItem("token", validToken);

    const mockDonations = [
      {
        _id: "don-003",
        donorName: "Supporter Three",
        amount: 150,
        message: "Hey",
        paymentMethod: "truemoney",
        status: "pending",
      },
    ];

    api.fetchDonationHistory.mockResolvedValue({
      donations: mockDonations,
      pagination: { total: 1, page: 1, totalPages: 1 },
    });
    api.updateDonationStatus.mockResolvedValueOnce({ _id: "don-003", status: "rejected" });

    render(
      <MemoryRouter initialEntries={["/history"]}>
        <HistoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Supporter Three")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Supporter Three"));

    const rejectBtn = screen.getByRole("button", { name: /ปฏิเสธรายการ/i });
    fireEvent.click(rejectBtn);

    await waitFor(() => {
      expect(api.updateDonationStatus).toHaveBeenCalledWith("don-003", "rejected");
      expect(screen.getByText("ปฏิเสธรายการบริจาคสำเร็จ")).toBeInTheDocument();
    });
  });

  test("filters donations by status tab", async () => {
    localStorage.setItem("token", validToken);

    render(
      <MemoryRouter initialEntries={["/history"]}>
        <HistoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.fetchDonationHistory).toHaveBeenCalled();
    });

    const pendingTab = screen.getByRole("button", { name: "รอตรวจสอบ" });
    fireEvent.click(pendingTab);

    await waitFor(() => {
      expect(api.fetchDonationHistory).toHaveBeenCalledWith(
        expect.objectContaining({ status: "pending" })
      );
    });
  });

  test("renders SlipModal null when not open", () => {
    const { container } = render(
      <SlipModal isOpen={false} donation={null} onClose={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  test("allows clicking slip image to enlarge and close via button, backdrop, and Escape", () => {
    const onClose = jest.fn();
    const mockDonation = {
      _id: "don-zoom-01",
      donorName: "Big Donor",
      amount: 1000,
      slipImage: "https://example.com/large-slip.jpg",
      status: "pending",
    };

    render(
      <SlipModal
        isOpen={true}
        donation={mockDonation}
        onClose={onClose}
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />
    );

    // Initial state: thumbnail image is rendered, zoom dialog is not
    const slipThumbnail = screen.getByAltText("สลิปหลักฐานการโอน");
    expect(slipThumbnail).toBeInTheDocument();
    expect(screen.queryByAltText("สลิปหลักฐานการโอนขนาดเต็ม")).not.toBeInTheDocument();

    // Click to enlarge
    fireEvent.click(slipThumbnail);

    // Zoom modal should now be visible
    expect(screen.getByAltText("สลิปหลักฐานการโอนขนาดเต็ม")).toBeInTheDocument();
    expect(screen.getByText("สลิปโอนเงิน (ขนาดเต็ม)")).toBeInTheDocument();

    // Close via close button in zoom modal
    const closeZoomBtn = screen.getByRole("button", { name: "ปิดรูปภาพ" });
    fireEvent.click(closeZoomBtn);
    expect(screen.queryByAltText("สลิปหลักฐานการโอนขนาดเต็ม")).not.toBeInTheDocument();

    // Reopen and test close via Escape key
    fireEvent.click(slipThumbnail);
    expect(screen.getByAltText("สลิปหลักฐานการโอนขนาดเต็ม")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByAltText("สลิปหลักฐานการโอนขนาดเต็ม")).not.toBeInTheDocument();
    // Verify onClose was not called when closing zoom dialog
    expect(onClose).not.toHaveBeenCalled();

    // Escape again when not zoomed should call onClose
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();

    // Reopen and test close via clicking backdrop button
    fireEvent.click(slipThumbnail);
    const backdropBtn = screen.getByRole("button", { name: "ปิดรูปขนาดใหญ่" });
    fireEvent.click(backdropBtn);
    expect(screen.queryByAltText("สลิปหลักฐานการโอนขนาดเต็ม")).not.toBeInTheDocument();
  });
});
