import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import OverlayAlertPage from "./OverlayAlertPage";
import { mockSocketInstance } from "../__mocks__/socket.io-client";

jest.mock("socket.io-client");

describe("OverlayAlertPage Component (Animation Lifecycle & Visuals)", () => {
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
      <MemoryRouter initialEntries={["/overlay/alert/sample_token"]}>
        <Routes>
          <Route path="/overlay/alert/:token" element={<OverlayAlertPage />} />
        </Routes>
      </MemoryRouter>
    );

    const container = screen.getByTestId("overlay-alert-container");
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass("bg-transparent");
    expect(document.body.style.backgroundColor).toBe("transparent");

    unmount();
    expect(document.body.style.backgroundColor).toBe(originalBg);
  });

  test("lifecycle: progresses from entering -> visible -> exiting -> idle with animation classes", () => {
    render(
      <MemoryRouter initialEntries={["/overlay/alert/sample_token?demo=1"]}>
        <Routes>
          <Route path="/overlay/alert/:token" element={<OverlayAlertPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial trigger: stage 'entering'
    const card = screen.getByTestId("alert-display-card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute("data-stage", "entering");
    expect(card).toHaveClass("anim-bounceIn");

    // Advance by durationIn (0.8s) -> stage 'visible'
    act(() => {
      jest.advanceTimersByTime(800);
    });
    expect(card).toHaveAttribute("data-stage", "visible");

    // Advance by durationDisplay (5s) -> stage 'exiting'
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(card).toHaveAttribute("data-stage", "exiting");
    expect(card).toHaveClass("anim-fadeOut");

    // Advance by durationOut (0.8s) -> idle (card removed)
    act(() => {
      jest.advanceTimersByTime(800);
    });
    expect(screen.queryByTestId("alert-display-card")).not.toBeInTheDocument();
  });

  test("clicking 'ทดสอบแจ้งเตือน' button triggers alert lifecycle", () => {
    render(
      <MemoryRouter initialEntries={["/overlay/alert"]}>
        <Routes>
          <Route path="/overlay/alert" element={<OverlayAlertPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId("alert-display-card")).not.toBeInTheDocument();

    const testBtn = screen.getByRole("button", { name: "ทดสอบแจ้งเตือน" });
    fireEvent.click(testBtn);

    const card = screen.getByTestId("alert-display-card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute("data-stage", "entering");
  });

  test("supports Amount Tiers image replacement when configured", async () => {
    const mockConfigWithTiers = {
      data: {
        alert: {
          animationIn: "zoomIn",
          animationOut: "zoomOut",
          durationIn: 0.5,
          durationDisplay: 2,
          durationOut: 0.5,
          useAmountTiers: true,
          amountTiers: [
            { min: 1, max: 99, image: "https://example.com/small.png" },
            { min: 100, max: 999, image: "https://example.com/tier100.png" },
          ],
        },
      },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockConfigWithTiers,
    });

    render(
      <MemoryRouter initialEntries={["/overlay/alert/tier_token?demo=1"]}>
        <Routes>
          <Route path="/overlay/alert/:token" element={<OverlayAlertPage />} />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    // SAMPLE_ALERTS[0] has amount: 100, so it matches tier 100-999
    const img = screen.getByRole("img", { name: "Alert Overlay" });
    expect(img).toHaveAttribute("src", "https://example.com/tier100.png");
  });

  test("handles fetch failure gracefully without breaking alert display", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network Error"));

    render(
      <MemoryRouter initialEntries={["/overlay/alert/fail_token?demo=1"]}>
        <Routes>
          <Route path="/overlay/alert/:token" element={<OverlayAlertPage />} />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId("alert-display-card")).toBeInTheDocument();
    expect(screen.getByText("ผู้สนับสนุนใจดี")).toBeInTheDocument();
  });

  test("triggers sound and text-to-speech with cleanup on unmount", async () => {
    const mockAudioContext = jest.fn(() => ({
      currentTime: 0,
      destination: {},
      createOscillator: jest.fn(() => ({
        connect: jest.fn(),
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { setValueAtTime: jest.fn() },
      })),
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
      })),
    }));

    window.AudioContext = mockAudioContext;
    window.speechSynthesis = {
      speak: jest.fn(),
      cancel: jest.fn(),
      getVoices: jest.fn(() => [{ lang: "th-TH", name: "Thai Female" }]),
    };
    global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({ text }));

    const { unmount } = render(
      <MemoryRouter initialEntries={["/overlay/alert?demo=1"]}>
        <Routes>
          <Route path="/overlay/alert" element={<OverlayAlertPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(mockAudioContext).toHaveBeenCalled();

    // Advance 500ms to trigger TTS and resolve getAvailableVoices
    await act(async () => {
      jest.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(window.speechSynthesis.speak).toHaveBeenCalled();

    unmount();
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  test("FIFO queue: processes multiple alerts sequentially with queue counter and cooldown", () => {
    render(
      <MemoryRouter initialEntries={["/overlay/alert"]}>
        <Routes>
          <Route path="/overlay/alert" element={<OverlayAlertPage />} />
        </Routes>
      </MemoryRouter>
    );

    const testBtn = screen.getByRole("button", { name: "ทดสอบแจ้งเตือน" });

    // Click twice to trigger 1 active alert + 1 queued alert
    act(() => {
      fireEvent.click(testBtn);
      fireEvent.click(testBtn);
    });

    // 1st alert is entering, queue counter shows "คิวรอ: 1"
    expect(screen.getByTestId("alert-display-card")).toBeInTheDocument();
    expect(screen.getByText(/คิวรอ: 1/)).toBeInTheDocument();

    // Advance 1st alert to completion (0.8s in + 5s display + 0.8s out = 6600ms)
    act(() => {
      jest.advanceTimersByTime(6600);
    });

    // During 400ms cooldown, card is idle
    expect(screen.queryByTestId("alert-display-card")).not.toBeInTheDocument();

    // Advance 400ms cooldown to dequeue 2nd alert
    act(() => {
      jest.advanceTimersByTime(400);
    });

    // 2nd alert is now entering and queue is empty
    expect(screen.getByTestId("alert-display-card")).toBeInTheDocument();
    expect(screen.queryByText(/คิวรอ:/)).not.toBeInTheDocument();
  });

  test("skip and clearQueue buttons control active alert and queued items", () => {
    render(
      <MemoryRouter initialEntries={["/overlay/alert"]}>
        <Routes>
          <Route path="/overlay/alert" element={<OverlayAlertPage />} />
        </Routes>
      </MemoryRouter>
    );

    const testBtn = screen.getByRole("button", { name: "ทดสอบแจ้งเตือน" });

    // Enqueue 3 alerts: 1 active, 2 in queue
    act(() => {
      fireEvent.click(testBtn);
      fireEvent.click(testBtn);
      fireEvent.click(testBtn);
    });

    expect(screen.getByText(/คิวรอ: 2/)).toBeInTheDocument();

    // Skip current alert -> immediately pops next alert from queue
    const skipBtn = screen.getByRole("button", { name: "ข้าม" });
    act(() => {
      fireEvent.click(skipBtn);
    });

    expect(screen.getByTestId("alert-display-card")).toBeInTheDocument();
    expect(screen.getByText(/คิวรอ: 1/)).toBeInTheDocument();

    // Clear queue -> removes remaining queued item
    const clearBtn = screen.getByRole("button", { name: /ล้างคิว/ });
    act(() => {
      fireEvent.click(clearBtn);
    });

    expect(screen.queryByText(/คิวรอ:/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("alert-display-card")).not.toBeInTheDocument();
  });

  test("filters out incoming donations below minAmount threshold", async () => {
    const mockConfigWithMin = {
      data: {
        alert: {
          minAmount: 200,
        },
      },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockConfigWithMin,
    });

    render(
      <MemoryRouter initialEntries={["/overlay/alert/min_filter_token"]}>
        <Routes>
          <Route path="/overlay/alert/:token" element={<OverlayAlertPage />} />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByTestId("alert-display-card")).not.toBeInTheDocument();
  });

  test("connects to socket, joins stream room, and displays real-time donation-alert event", () => {
    mockSocketInstance.__clearListeners();
    mockSocketInstance.emit.mockClear();

    const { unmount } = render(
      <MemoryRouter initialEntries={["/overlay/alert/streamer_boss"]}>
        <Routes>
          <Route path="/overlay/alert/:token" element={<OverlayAlertPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify room joins
    expect(mockSocketInstance.emit).toHaveBeenCalledWith("join-stream", "streamer_boss");

    // Trigger incoming real-time donation alert via socket
    act(() => {
      mockSocketInstance.__trigger("donation-alert", {
        donorName: "น้องปลา",
        amount: 250,
        message: "สู้ๆ นะคะ สตรีมเมอร์คนโปรด",
      });
    });

    // Alert should appear
    const card = screen.getByTestId("alert-display-card");
    expect(card).toBeInTheDocument();
    expect(screen.getByText("น้องปลา")).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
    expect(screen.getByText(/"สู้ๆ นะคะ สตรีมเมอร์คนโปรด"/)).toBeInTheDocument();

    // Cleanup on unmount
    unmount();
    expect(mockSocketInstance.off).toHaveBeenCalledWith("donation-alert", expect.any(Function));
    expect(mockSocketInstance.emit).toHaveBeenCalledWith("leave-stream", "streamer_boss");
  });

  test("ignores incoming socket alert below minAmount threshold", () => {
    mockSocketInstance.__clearListeners();

    // Set widget storage config minAmount to 300
    const currentStorage = JSON.parse(localStorage.getItem("donix_widget_config") || "{}");
    localStorage.setItem(
      "donix_widget_config",
      JSON.stringify({
        ...currentStorage,
        alert: { ...(currentStorage.alert || {}), minAmount: 300 },
      })
    );

    render(
      <MemoryRouter initialEntries={["/overlay/alert/streamer_boss"]}>
        <Routes>
          <Route path="/overlay/alert/:token" element={<OverlayAlertPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Incoming alert is 50 (< 300)
    act(() => {
      mockSocketInstance.__trigger("donation-alert", {
        donorName: "ผู้สนับสนุนเล็กน้อย",
        amount: 50,
        message: "นิดๆ หน่อยๆ ครับ",
      });
    });

    expect(screen.queryByTestId("alert-display-card")).not.toBeInTheDocument();

    // Clean up local storage
    localStorage.removeItem("donix_widget_config");
  });
});

