import React from "react";
import { render, screen, act } from "@testing-library/react";
import OAuthCallback from "./OAuthCallback";

describe("OAuthCallback Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders callback message and posts message to window.opener", () => {
    const mockPostMessage = jest.fn();
    const mockClose = jest.fn();

    window.opener = {
      postMessage: mockPostMessage,
    };
    window.close = mockClose;

    // Set search query
    delete window.location;
    window.location = new URL("http://localhost:3000/oauth-callback?code=mock_code_123&state=twitch_abc");

    render(<OAuthCallback />);

    expect(screen.getByText("ยืนยันตัวตนสำเร็จ")).toBeInTheDocument();
    expect(screen.getByText(/กำลังเชื่อมต่อบัญชีกับระบบ DONIX/)).toBeInTheDocument();

    expect(mockPostMessage).toHaveBeenCalledWith(
      {
        type: "OAUTH_CALLBACK",
        code: "mock_code_123",
        state: "twitch_abc",
        error: null,
      },
      "http://localhost:3000"
    );

    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(mockClose).toHaveBeenCalled();
  });

  test("gracefully renders when window.opener is not present", () => {
    delete window.opener;
    delete window.location;
    window.location = new URL("http://localhost:3000/oauth-callback");

    render(<OAuthCallback />);
    expect(screen.getByText("ยืนยันตัวตนสำเร็จ")).toBeInTheDocument();
  });
});
