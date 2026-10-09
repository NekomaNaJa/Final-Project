import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import OverlayGoalPage from "./OverlayGoalPage";
import { mockSocketInstance } from "../__mocks__/socket.io-client";

jest.mock("socket.io-client");

describe("OverlayGoalPage Component", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockSocketInstance.__reset();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders overlay container with transparent background and restores on unmount", () => {
    const originalBg = document.body.style.backgroundColor;

    const { unmount } = render(
      <MemoryRouter initialEntries={["/overlay/goal/goal_token_123"]}>
        <Routes>
          <Route path="/overlay/goal/:token" element={<OverlayGoalPage />} />
        </Routes>
      </MemoryRouter>
    );

    const container = screen.getByTestId("overlay-goal-container");
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass("bg-transparent");
    expect(document.body.style.backgroundColor).toBe("transparent");

    unmount();
    expect(document.body.style.backgroundColor).toBe(originalBg);
  });

  test("fetches goal config and initial amount from API when token is provided", async () => {
    const mockGoalData = {
      data: {
        goal: {
          title: "เป้าหมายซื้อไมค์ใหม่",
          target: 20000,
          current: 8000,
          theme: "crimson",
          startDate: "2026-09-01",
          endDate: "2026-09-30",
        },
      },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGoalData,
    });

    render(
      <MemoryRouter initialEntries={["/overlay/goal/mic_goal_token"]}>
        <Routes>
          <Route path="/overlay/goal/:token" element={<OverlayGoalPage />} />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText("เป้าหมายซื้อไมค์ใหม่")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument(); // 8000 / 20000 = 40%
    expect(screen.getByText("2026-09-01 ถึง 2026-09-30")).toBeInTheDocument();
  });

  test("connects to socket and updates goal amount on real-time donation-alert event", () => {
    mockSocketInstance.__clearListeners();
    mockSocketInstance.emit.mockClear();

    const { unmount } = render(
      <MemoryRouter initialEntries={["/overlay/goal/streamer_goal_room"]}>
        <Routes>
          <Route path="/overlay/goal/:token" element={<OverlayGoalPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      "join-stream",
      "streamer_goal_room"
    );

    // Incoming donation alert of 1000 baht
    act(() => {
      mockSocketInstance.__trigger("donation-alert", {
        donorName: "ป๋าเปย์",
        amount: 1000,
      });
    });

    expect(screen.getByText(/1,000/)).toBeInTheDocument();

    unmount();
    expect(mockSocketInstance.off).toHaveBeenCalledWith(
      "donation-alert",
      expect.any(Function)
    );
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      "leave-stream",
      "streamer_goal_room"
    );
  });

  test("preview buttons +100, +500, and reset update the goal correctly", () => {
    render(
      <MemoryRouter initialEntries={["/overlay/goal"]}>
        <Routes>
          <Route path="/overlay/goal" element={<OverlayGoalPage />} />
        </Routes>
      </MemoryRouter>
    );

    const btn100 = screen.getByRole("button", { name: "+100 ฿" });
    const btn500 = screen.getByRole("button", { name: "+500 ฿" });
    const btnReset = screen.getByRole("button", { name: "รีเซ็ต" });

    fireEvent.click(btn100);
    expect(screen.getByText(/100 ฿ เพิ่งเข้ามา!/)).toBeInTheDocument();

    fireEvent.click(btn500);
    expect(screen.getByText(/500 ฿ เพิ่งเข้ามา!/)).toBeInTheDocument();

    fireEvent.click(btnReset);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  test("handles fetch failure gracefully", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network fail"));

    render(
      <MemoryRouter initialEntries={["/overlay/goal/fail_token"]}>
        <Routes>
          <Route path="/overlay/goal/:token" element={<OverlayGoalPage />} />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId("goal-display-card")).toBeInTheDocument();
  });
});
