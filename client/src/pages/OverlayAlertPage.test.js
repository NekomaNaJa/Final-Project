import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import OverlayAlertPage from "./OverlayAlertPage";

describe("OverlayAlertPage Component (Animation Lifecycle & Visuals)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
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

  test("triggers sound and text-to-speech with cleanup on unmount", () => {
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

    // Advance 500ms to trigger TTS
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(window.speechSynthesis.speak).toHaveBeenCalled();

    unmount();
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });
});
