import React from "react";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import HistoryPage from "./HistoryPage";

describe("HistoryPage", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
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
    const payload = btoa(JSON.stringify({ username: "streamer_pro" }));
    localStorage.setItem("token", `header.${payload}.signature`);
    window.history.pushState({}, "", "/history");

    render(
      <MemoryRouter initialEntries={["/history"]}>
        <HistoryPage />
      </MemoryRouter>
    );

    act(() => {
      jest.runAllTimers();
    });

    // ชื่อผู้ใช้โชว์ทั้งใน Topbar และหัวข้อหน้า
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
});
