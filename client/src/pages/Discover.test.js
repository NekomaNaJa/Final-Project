import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Discover from "./Discover";

describe("Discover page", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("renders heading and all category sections with streamer cards", () => {
    render(
      <MemoryRouter>
        <Discover />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /ค้นพบ/ })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Explore your favorite streamer")
    ).toBeInTheDocument();

    expect(screen.getByText("กำลังไลฟ์สตรีม")).toBeInTheDocument();
    expect(screen.getByText("เกมที่กำลังได้รับความนิยม")).toBeInTheDocument();
    expect(screen.getByText("คุณอาจจะสนใจ")).toBeInTheDocument();
    expect(screen.getByText("สตรีมเมอร์แนะนำ")).toBeInTheDocument();

    // ดูทั้งหมด links
    expect(screen.getAllByText("ดูทั้งหมด").length).toBeGreaterThanOrEqual(4);

    // 4 categories * 3 cards = 12 cards
    const names = screen.getAllByText("Name Streamer");
    expect(names.length).toBe(12);

    // LIVE badge should appear only for live category (3 cards)
    expect(screen.getAllByText("LIVE").length).toBe(3);
  });
});
