import React from "react";
import { render, screen, act } from "@testing-library/react";
import App from "./App";

describe("App routing for new pages", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    window.history.pushState({}, "", "/");
  });

  test("/discover renders Discover page", () => {
    window.history.pushState({}, "", "/discover");
    render(<App />);
    expect(
      screen.getByRole("heading", { level: 1, name: /ค้นพบ/ })
    ).toBeInTheDocument();
  });

  test("/how-it-works renders HowToUse page", () => {
    window.history.pushState({}, "", "/how-it-works");
    render(<App />);
    expect(screen.getByText("3 ขั้นตอน")).toBeInTheDocument();
  });

  test("/history redirects to login without token", () => {
    window.history.pushState({}, "", "/history");
    render(<App />);
    expect(
      screen.getByRole("heading", { level: 1, name: "เข้าสู่ระบบ" })
    ).toBeInTheDocument();
  });

  test("/history renders HistoryPage with token", () => {
    const payload = btoa(JSON.stringify({ username: "streamer_pro" }));
    localStorage.setItem("token", `header.${payload}.signature`);
    window.history.pushState({}, "", "/history");

    render(<App />);

    act(() => {
      jest.runAllTimers();
    });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "ประวัติการรับเงินของ streamer_pro"
    );
  });

  test("/overlay/alert/:token renders OverlayAlertPage", () => {
    window.history.pushState({}, "", "/overlay/alert/streamer_token");
    render(<App />);
    expect(screen.getByTestId("overlay-alert-container")).toBeInTheDocument();
  });
});