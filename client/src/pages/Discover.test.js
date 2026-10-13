import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Discover from "./Discover";
import * as api from "../utils/api";

jest.mock("../utils/api", () => {
  const original = jest.requireActual("../utils/api");
  return {
    ...original,
    fetchPublicStreamers: jest.fn(),
  };
});

describe("Discover page", () => {
  const mockStreamers = [
    {
      username: "sawadee",
      nickname: "sawadee",
      avatar: "https://example.com/sawadee.jpg",
      isLive: true,
    },
    {
      username: "nekomacafe",
      nickname: "Nekoma",
      avatar: "https://example.com/nekoma.jpg",
      isLive: false,
    },
    {
      username: "EasyDonate",
      nickname: "EasyDonate",
      avatar: "",
      isLive: false,
    },
    {
      username: "Test3",
      nickname: "Test3",
      avatar: "https://example.com/test3.jpg",
      isLive: false,
    },
    {
      username: "test2",
      nickname: "test2",
      avatar: "",
      isLive: false,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("renders heading, featured streamers at top with carousel, and category sections", async () => {
    api.fetchPublicStreamers.mockResolvedValueOnce(mockStreamers);

    render(
      <MemoryRouter>
        <Discover />
      </MemoryRouter>
    );

    // Verify main headings
    expect(
      screen.getByRole("heading", { level: 1, name: /ค้นพบ/ })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Explore your favorite streamer")
    ).toBeInTheDocument();

    // Verify "สตรีมเมอร์แนะนำ" (Featured Streamer) is present
    expect(screen.getByText("สตรีมเมอร์แนะนำ")).toBeInTheDocument();
    expect(screen.getByText("Streamer แนะนำประจำสัปดาห์")).toBeInTheDocument();

    // Verify other categories below it
    expect(screen.getByText("กำลังไลฟ์สตรีม")).toBeInTheDocument();
    expect(screen.getByText("เกมที่กำลังได้รับความนิยม")).toBeInTheDocument();
    expect(screen.getByText("คุณอาจจะสนใจ")).toBeInTheDocument();

    // Wait for featured streamers from API
    await waitFor(() => {
      expect(screen.getByText("sawadee")).toBeInTheDocument();
      expect(screen.getByText("@sawadee")).toBeInTheDocument();
      expect(screen.getByText("Nekoma")).toBeInTheDocument();
      expect(screen.getByText("@nekomacafe")).toBeInTheDocument();
      expect(screen.getAllByText("EasyDonate").length).toBeGreaterThan(0);
    });

    // Verify profile link on card
    const sawadeeCard = screen.getByTestId("streamer-card-sawadee");
    expect(sawadeeCard).toHaveAttribute("href", "/sawadee/profile");

    // Verify Carousel Buttons
    const prevBtn = screen.getByTestId("carousel-prev-btn");
    const nextBtn = screen.getByTestId("carousel-next-btn");

    // Initially at index 0: prev is disabled, next is enabled (5 streamers > 3)
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Click next button
    fireEvent.click(nextBtn);
    expect(prevBtn).not.toBeDisabled();

    // Click prev button
    fireEvent.click(prevBtn);
    expect(prevBtn).toBeDisabled();
  });

  test("handles touch swipe navigation for featured streamers carousel", async () => {
    api.fetchPublicStreamers.mockResolvedValueOnce(mockStreamers);

    render(
      <MemoryRouter>
        <Discover />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("sawadee")).toBeInTheDocument();
    });

    const prevBtn = screen.getByTestId("carousel-prev-btn");
    const track = screen.getByTestId("carousel-track").parentElement;

    // Swipe left (advance carousel)
    fireEvent.touchStart(track, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(track, { changedTouches: [{ clientX: 100 }] });

    expect(prevBtn).not.toBeDisabled();

    // Swipe right (go back)
    fireEvent.touchStart(track, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(track, { changedTouches: [{ clientX: 200 }] });

    expect(prevBtn).toBeDisabled();
  });

  test("displays empty state when no featured streamers are returned", async () => {
    api.fetchPublicStreamers.mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <Discover />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText("ยังไม่มีสตรีมเมอร์ในระบบขณะนี้")
      ).toBeInTheDocument();
    });
  });

  test("handles api error gracefully and keeps empty state", async () => {
    api.fetchPublicStreamers.mockRejectedValueOnce(new Error("Network error"));

    render(
      <MemoryRouter>
        <Discover />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText("ยังไม่มีสตรีมเมอร์ในระบบขณะนี้")
      ).toBeInTheDocument();
    });
  });
});
