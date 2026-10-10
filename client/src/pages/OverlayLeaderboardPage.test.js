import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import OverlayLeaderboardPage from "./OverlayLeaderboardPage";
import { mockSocketInstance } from "../__mocks__/socket.io-client";

jest.mock("socket.io-client");

describe("OverlayLeaderboardPage Component", () => {
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
      <MemoryRouter initialEntries={["/overlay/leaderboard/token_xyz"]}>
        <Routes>
          <Route
            path="/overlay/leaderboard/:token"
            element={<OverlayLeaderboardPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    const container = screen.getByTestId("overlay-leaderboard-container");
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass("bg-transparent");
    expect(document.body.style.backgroundColor).toBe("transparent");

    unmount();
    expect(document.body.style.backgroundColor).toBe(originalBg);
  });

  test("fetches leaderboard config and donors from API when token is provided", async () => {
    const mockLeaderboardData = {
      data: {
        token: "top_token_xyz",
        streamer: {
          id: "streamer_lb_id",
          username: "lb_streamer",
        },
        leaderboard: {
          title: "ผู้สนับสนุนยอดเยี่ยมแห่งปี",
          limit: 3,
          showAmount: true,
          donors: [
            { name: "ผู้สนับสนุนอันดับหนึ่ง", amount: 15000, totalAmount: 15000 },
            { name: "สายเปย์เมืองกรุง", amount: 9000, totalAmount: 9000 },
            { name: "คนใจดี", amount: 4500, totalAmount: 4500 },
          ],
        },
      },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockLeaderboardData,
    });

    render(
      <MemoryRouter initialEntries={["/overlay/leaderboard/top_token"]}>
        <Routes>
          <Route
            path="/overlay/leaderboard/:token"
            element={<OverlayLeaderboardPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText("ผู้สนับสนุนยอดเยี่ยมแห่งปี")).toBeInTheDocument();
    expect(screen.getByText("อันดับสูงสุด 3 ท่าน")).toBeInTheDocument();
    expect(screen.getByText("ผู้สนับสนุนอันดับหนึ่ง")).toBeInTheDocument();
    expect(screen.getByText("15,000 ฿")).toBeInTheDocument();
  });

  test("connects to socket and updates leaderboard rankings in real time", () => {
    mockSocketInstance.__clearListeners();
    mockSocketInstance.emit.mockClear();

    const { unmount } = render(
      <MemoryRouter initialEntries={["/overlay/leaderboard/lb_room"]}>
        <Routes>
          <Route
            path="/overlay/leaderboard/:token"
            element={<OverlayLeaderboardPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith("join-stream", "lb_room");

    // Incoming donation alert for a new donor who takes top rank
    act(() => {
      mockSocketInstance.__trigger("donation-alert", {
        donorName: "มหาเศรษฐีใจดี",
        amount: 99999,
      });
    });

    expect(screen.getByText("มหาเศรษฐีใจดี")).toBeInTheDocument();
    expect(screen.getByText("99,999 ฿")).toBeInTheDocument();
    expect(screen.getByText(/อัปเดตล่าสุด/)).toBeInTheDocument();

    unmount();
    expect(mockSocketInstance.off).toHaveBeenCalledWith(
      "donation-alert",
      expect.any(Function)
    );
    expect(mockSocketInstance.emit).toHaveBeenCalledWith("leave-stream", "lb_room");
  });

  test("updates ranking on incoming real donation alert", () => {
    render(
      <MemoryRouter initialEntries={["/overlay/leaderboard/lb_room"]}>
        <Routes>
          <Route
            path="/overlay/leaderboard/:token"
            element={<OverlayLeaderboardPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    act(() => {
      mockSocketInstance.__trigger("donation-alert", {
        donorName: "ผู้สนับสนุน VIP",
        amount: 1000,
      });
    });

    expect(screen.getByText("ผู้สนับสนุน VIP")).toBeInTheDocument();
    expect(screen.getByText("1,000 ฿")).toBeInTheDocument();
  });

  test("handles fetch failure gracefully", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network down"));

    render(
      <MemoryRouter initialEntries={["/overlay/leaderboard/fail_token"]}>
        <Routes>
          <Route
            path="/overlay/leaderboard/:token"
            element={<OverlayLeaderboardPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId("leaderboard-display-card")).toBeInTheDocument();
  });

  test("updates leaderboard config in real time when widget-config-updated is received", () => {
    mockSocketInstance.__clearListeners();

    render(
      <MemoryRouter initialEntries={["/overlay/leaderboard/lb_room"]}>
        <Routes>
          <Route
            path="/overlay/leaderboard/:token"
            element={<OverlayLeaderboardPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    act(() => {
      mockSocketInstance.__trigger("widget-config-updated", {
        leaderboard: {
          title: "ยอดนักบริจาคประจำเดือน",
          limit: 10,
        },
      });
      mockSocketInstance.__trigger("widget-config-updated", null);
      mockSocketInstance.__trigger("widget-config-updated", {});
    });

    expect(screen.getByText("ยอดนักบริจาคประจำเดือน")).toBeInTheDocument();
  });

  test("ignores test alerts when isTest flag is true", () => {
    mockSocketInstance.__clearListeners();

    render(
      <MemoryRouter initialEntries={["/overlay/leaderboard/lb_room"]}>
        <Routes>
          <Route
            path="/overlay/leaderboard/:token"
            element={<OverlayLeaderboardPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    act(() => {
      mockSocketInstance.__trigger("donation-alert", {
        donorName: "ผู้ทดสอบบอท",
        amount: 500,
        isTest: true,
      });
    });

    expect(screen.queryByText("ผู้ทดสอบบอท")).not.toBeInTheDocument();
  });

  test("renders empty state when donors list is empty", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          token: "tok",
          leaderboard: {
            title: "TOP DONORS",
            limit: 5,
            donors: [],
          },
        },
      }),
    });

    render(
      <MemoryRouter initialEntries={["/overlay/leaderboard/tok"]}>
        <Routes>
          <Route
            path="/overlay/leaderboard/:token"
            element={<OverlayLeaderboardPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText("ยังไม่มีผู้สนับสนุนในรอบนี้")).toBeInTheDocument();
  });
});
