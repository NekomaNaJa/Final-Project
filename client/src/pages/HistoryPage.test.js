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
    fetchDonationSlip: jest.fn(),
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
    api.fetchDonationSlip.mockResolvedValue({ slipImage: null });
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

  test("displays OCR verification banner and transRef in SlipModal when present", () => {
    const mockDonation = {
      _id: "don-ocr-01",
      donorName: "OCR Donor",
      amount: 500,
      slipImage: "https://example.com/slip.jpg",
      status: "approved",
      transRef: "REF_AUTO_12345",
      ocrResult: {
        verified: true,
        bankName: "ธนาคารกสิกรไทย (KBANK)",
      },
    };

    render(
      <SlipModal
        isOpen={true}
        donation={mockDonation}
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByText("สลิปผ่านการตรวจสอบอัตโนมัติ (OCR Verified)")
    ).toBeInTheDocument();
    expect(screen.getByText("ตรวจสอบแล้ว")).toBeInTheDocument();
    expect(screen.getByText("REF_AUTO_12345")).toBeInTheDocument();
    expect(screen.getByText(/ธนาคารกสิกรไทย/)).toBeInTheDocument();
  });

  test("displays manual review notice in SlipModal when slipImage is present but OCR is unverified", () => {
    const mockDonation = {
      _id: "don-ocr-unverified",
      donorName: "Manual Donor",
      amount: 100,
      slipImage: "https://example.com/slip.jpg",
      status: "pending",
      transRef: null,
      ocrResult: {
        verified: false,
        message: "ไม่พบ QR Code บนสลิป กรุณาตรวจสอบรูปภาพด้วยตนเอง",
      },
    };

    render(
      <SlipModal
        isOpen={true}
        donation={mockDonation}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText("รอการตรวจสอบด้วยตนเอง")).toBeInTheDocument();
    expect(
      screen.getByText("ไม่พบ QR Code บนสลิป กรุณาตรวจสอบรูปภาพด้วยตนเอง")
    ).toBeInTheDocument();
    expect(screen.queryByText("ตรวจสอบแล้ว")).not.toBeInTheDocument();
  });

  test("renders OCR badge in DonationHistoryTable when donation has ocrResult verified or transRef", async () => {
    const { default: DonationHistoryTable } = await import(
      "../components/Histor/DonationHistoryTable"
    );

    const history = [
      {
        id: "don-ocr-table-1",
        time: "15:30",
        name: "OCR Supporter",
        message: "สลิปพร้อมเพย์",
        amount: 500,
        paymentMethod: "promptpay",
        status: "approved",
        transRef: "PROMPT_REF_9999",
        ocrResult: {
          verified: true,
          transRef: "PROMPT_REF_9999",
        },
      },
    ];

    render(<DonationHistoryTable history={history} />);

    expect(screen.getByText("OCR")).toBeInTheDocument();
    expect(screen.getByText("อนุมัติแล้ว")).toBeInTheDocument();
    expect(screen.getByTitle(/PROMPT_REF_9999/)).toBeInTheDocument();
  });

  describe("DonationHistoryTable & SlipModal date/time formatting", () => {
    test("handles valid createdAt without time in DonationHistoryTable", async () => {
      const { default: DonationHistoryTable } = await import(
        "../components/Histor/DonationHistoryTable"
      );
      const testIso = "2026-10-12T10:30:00.000Z";
      const expectedDate = new Date(testIso).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const expectedTime = new Date(testIso).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      });

      render(
        <DonationHistoryTable
          history={[
            {
              id: "item-created-at",
              name: "User Date",
              amount: 100,
              createdAt: testIso,
            },
          ]}
        />
      );

      expect(screen.getByText(expectedDate)).toBeInTheDocument();
      expect(screen.getByText(`${expectedTime} น.`)).toBeInTheDocument();
    });

    test("handles invalid createdAt in DonationHistoryTable", async () => {
      const { default: DonationHistoryTable } = await import(
        "../components/Histor/DonationHistoryTable"
      );

      render(
        <DonationHistoryTable
          history={[
            {
              id: "item-invalid-date",
              name: "User Invalid",
              message: "ข้อความทดสอบ",
              amount: 100,
              createdAt: "not-a-valid-date",
            },
          ]}
        />
      );

      expect(screen.getByText("-")).toBeInTheDocument();
      expect(screen.getByText("User Invalid")).toBeInTheDocument();
    });

    test("handles custom date and time in DonationHistoryTable", async () => {
      const { default: DonationHistoryTable } = await import(
        "../components/Histor/DonationHistoryTable"
      );

      render(
        <DonationHistoryTable
          history={[
            {
              id: "item-custom-date",
              name: "User Custom",
              amount: 100,
              date: "12 ต.ค. 2026",
              time: "14:20",
            },
          ]}
        />
      );

      expect(screen.getByText("12 ต.ค. 2026")).toBeInTheDocument();
      expect(screen.getByText("14:20 น.")).toBeInTheDocument();
    });

    test("handles valid createdAt with existing time in DonationHistoryTable", async () => {
      const { default: DonationHistoryTable } = await import(
        "../components/Histor/DonationHistoryTable"
      );
      const testIso = "2026-10-12T10:30:00.000Z";
      const expectedDate = new Date(testIso).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      render(
        <DonationHistoryTable
          history={[
            {
              id: "item-with-both",
              name: "User Both",
              amount: 100,
              createdAt: testIso,
              time: "12:00",
            },
          ]}
        />
      );

      expect(screen.getByText(expectedDate)).toBeInTheDocument();
      expect(screen.getByText("12:00 น.")).toBeInTheDocument();
    });

    test("renders SlipModal with valid createdAt", async () => {
      const testIso = "2026-10-12T10:30:00.000Z";
      const expectedFormatted = new Date(testIso).toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      await act(async () => {
        render(
          <SlipModal
            isOpen={true}
            donation={{
              id: "slip-valid-date",
              donorName: "Supporter A",
              amount: 200,
              createdAt: testIso,
            }}
            onClose={jest.fn()}
          />
        );
      });

      expect(screen.getByText(expectedFormatted)).toBeInTheDocument();
    });

    test("renders SlipModal with invalid createdAt and fallback time", async () => {
      await act(async () => {
        render(
          <SlipModal
            isOpen={true}
            donation={{
              id: "slip-invalid-date",
              donorName: "Supporter B",
              amount: 200,
              createdAt: "invalid-date-string",
              time: "17:45",
            }}
            onClose={jest.fn()}
          />
        );
      });

      expect(screen.getByText("17:45")).toBeInTheDocument();
    });

    test("renders SlipModal with custom date and time without createdAt", async () => {
      await act(async () => {
        render(
          <SlipModal
            isOpen={true}
            donation={{
              id: "slip-date-time",
              donorName: "Supporter C",
              amount: 200,
              date: "12 ต.ค. 2026",
              time: "18:00",
            }}
            onClose={jest.fn()}
          />
        );
      });

      expect(screen.getByText("12 ต.ค. 2026 (18:00 น.)")).toBeInTheDocument();
    });

    test("renders SlipModal without date, time or createdAt", async () => {
      await act(async () => {
        render(
          <SlipModal
            isOpen={true}
            donation={{
              id: "slip-empty-date",
              donorName: "Supporter D",
              amount: 200,
            }}
            onClose={jest.fn()}
          />
        );
      });

      expect(screen.getByText("—")).toBeInTheDocument();
    });

    test("fetches slipImage on demand via fetchDonationSlip when slipImage is not in initial data", async () => {
      api.fetchDonationSlip.mockResolvedValueOnce({
        slipImage: "data:image/png;base64,lazyslip123",
      });

      render(
        <SlipModal
          isOpen={true}
          donation={{
            id: "slip-lazy-1",
            donorName: "Supporter E",
            amount: 500,
            paymentMethod: "promptpay",
          }}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(api.fetchDonationSlip).toHaveBeenCalledWith("slip-lazy-1");
      });

      await waitFor(() => {
        const img = screen.getByAltText("สลิปหลักฐานการโอน");
        expect(img).toHaveAttribute("src", "data:image/png;base64,lazyslip123");
      });
    });

    test("handles fetchDonationSlip failure gracefully and displays empty slip notice", async () => {
      api.fetchDonationSlip.mockRejectedValueOnce(new Error("Network error"));

      render(
        <SlipModal
          isOpen={true}
          donation={{
            id: "slip-lazy-fail",
            donorName: "Supporter F",
            amount: 300,
            paymentMethod: "bank",
          }}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(api.fetchDonationSlip).toHaveBeenCalledWith("slip-lazy-fail");
      });

      await waitFor(() => {
        expect(screen.getByText("ไม่มีรูปสลิปแนบมากับรายการนี้")).toBeInTheDocument();
      });
    });

    test("does not fetch slipImage when payment method is truemoney", () => {
      render(
        <SlipModal
          isOpen={true}
          donation={{
            id: "slip-truemoney",
            donorName: "Supporter G",
            amount: 100,
            paymentMethod: "truemoney",
          }}
          onClose={jest.fn()}
        />
      );

      expect(api.fetchDonationSlip).not.toHaveBeenCalled();
      expect(screen.getByText("ไม่มีรูปสลิปแนบมากับรายการนี้")).toBeInTheDocument();
    });
  });
});


