import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import * as api from "../utils/api";
import { mockSocketInstance } from "../__mocks__/socket.io-client";

jest.mock("socket.io-client");
jest.mock("../utils/api", () => {
  const original = jest.requireActual("../utils/api");
  return {
    ...original,
    fetchDonationHistory: jest.fn(),
    getAuthToken: jest.fn(),
  };
});

describe("NotificationBell Component", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockSocketInstance.__reset();
    api.getAuthToken.mockReturnValue("mock-token");
    api.fetchDonationHistory.mockResolvedValue({
      donations: [],
      pagination: { total: 0 },
    });
  });

  test("renders bell button without badge when there are no unread notifications", async () => {
    render(
      <MemoryRouter>
        <NotificationBell username="streamer_test" />
      </MemoryRouter>
    );

    await waitFor(() => expect(api.fetchDonationHistory).toHaveBeenCalled());
    const bellBtn = screen.getByRole("button", { name: "แจ้งเตือนการโดเนท" });
    expect(bellBtn).toBeInTheDocument();
    expect(screen.queryByTestId("notification-badge")).not.toBeInTheDocument();
  });

  test("fetches donations on mount and displays unread count badge", async () => {
    const mockDonations = [
      {
        _id: "notif-1",
        donorName: "Alice",
        amount: 250,
        message: "สู้ๆ นะครับ",
        paymentMethod: "PromptPay",
        createdAt: new Date().toISOString(),
      },
      {
        _id: "notif-2",
        donorName: "Bob",
        amount: 100,
        message: "",
        paymentMethod: "Bank",
        createdAt: new Date().toISOString(),
      },
    ];

    api.fetchDonationHistory.mockResolvedValueOnce({
      donations: mockDonations,
      pagination: { total: 2 },
    });

    render(
      <MemoryRouter>
        <NotificationBell username="streamer_test" />
      </MemoryRouter>
    );

    const badge = await screen.findByTestId("notification-badge");
    expect(badge).toHaveTextContent("2");
  });

  test("opens dropdown showing donation details (donorName, amount, message) when clicked", async () => {
    const mockDonations = [
      {
        _id: "notif-1",
        donorName: "Somchai",
        amount: 500,
        message: "เป็นกำลังใจให้ครับ",
        paymentMethod: "PromptPay",
        createdAt: new Date().toISOString(),
      },
    ];

    api.fetchDonationHistory.mockResolvedValueOnce({
      donations: mockDonations,
    });

    render(
      <MemoryRouter>
        <NotificationBell username="streamer_test" />
      </MemoryRouter>
    );

    const bellBtn = screen.getByRole("button", { name: "แจ้งเตือนการโดเนท" });
    await screen.findByTestId("notification-badge");

    fireEvent.click(bellBtn);

    const dropdown = screen.getByTestId("notification-dropdown");
    expect(dropdown).toBeInTheDocument();
    expect(screen.getByText("การแจ้งเตือน")).toBeInTheDocument();
    expect(screen.getByText("Somchai")).toBeInTheDocument();
    expect(screen.getByText("+500 ฿")).toBeInTheDocument();
    expect(screen.getByText("500 บาท")).toBeInTheDocument();
    expect(screen.getByText('"เป็นกำลังใจให้ครับ"')).toBeInTheDocument();
    expect(screen.getByText("PromptPay")).toBeInTheDocument();
  });

  test("shows empty state when there are no donations", async () => {
    render(
      <MemoryRouter>
        <NotificationBell username="streamer_test" />
      </MemoryRouter>
    );

    const bellBtn = screen.getByRole("button", { name: "แจ้งเตือนการโดเนท" });
    fireEvent.click(bellBtn);

    expect(await screen.findByText("ยังไม่มีการแจ้งเตือนการโดเนท")).toBeInTheDocument();
    expect(
      screen.getByText("เมื่อมีผู้สนับสนุนโดเนทเข้ามา การแจ้งเตือนจะแสดงที่นี่")
    ).toBeInTheDocument();
  });

  test("marks all notifications as read when clicking 'อ่านทั้งหมด'", async () => {
    const mockDonations = [
      {
        _id: "notif-1",
        donorName: "Alice",
        amount: 300,
        createdAt: new Date().toISOString(),
      },
    ];

    api.fetchDonationHistory.mockResolvedValueOnce({
      donations: mockDonations,
    });

    render(
      <MemoryRouter>
        <NotificationBell username="streamer_test" />
      </MemoryRouter>
    );

    await screen.findByTestId("notification-badge");
    fireEvent.click(screen.getByRole("button", { name: "แจ้งเตือนการโดเนท" }));

    const markAllBtn = screen.getByRole("button", { name: /อ่านทั้งหมด/i });
    fireEvent.click(markAllBtn);

    expect(screen.queryByTestId("notification-badge")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /อ่านทั้งหมด/i })).not.toBeInTheDocument();
  });

  test("marks a single notification as read when clicking it", async () => {
    const mockDonations = [
      {
        _id: "notif-single",
        donorName: "Single Supporter",
        amount: 200,
        createdAt: new Date().toISOString(),
      },
    ];

    api.fetchDonationHistory.mockResolvedValueOnce({
      donations: mockDonations,
    });

    render(
      <MemoryRouter>
        <NotificationBell username="streamer_test" />
      </MemoryRouter>
    );

    const badge = await screen.findByTestId("notification-badge");
    expect(badge).toHaveTextContent("1");

    fireEvent.click(screen.getByRole("button", { name: "แจ้งเตือนการโดเนท" }));
    const notifItem = screen.getByText("Single Supporter");
    fireEvent.click(notifItem);

    expect(screen.queryByTestId("notification-badge")).not.toBeInTheDocument();
  });

  test("receives real-time donation alert via socket and updates list and badge", async () => {
    render(
      <MemoryRouter>
        <NotificationBell username="streamer_realtime" />
      </MemoryRouter>
    );

    await waitFor(() => expect(api.fetchDonationHistory).toHaveBeenCalled());
    expect(screen.queryByTestId("notification-badge")).not.toBeInTheDocument();

    // จำลอง Socket.IO ส่งอีเวนต์ donation-alert เข้ามา
    act(() => {
      mockSocketInstance.__trigger("donation-alert", {
        id: "socket-notif-1",
        donorName: "Realtime Donor",
        amount: 999,
        message: "สุดยอดมากครับ!",
        paymentMethod: "PromptPay",
        createdAt: new Date().toISOString(),
      });
    });

    const badge = await screen.findByTestId("notification-badge");
    expect(badge).toHaveTextContent("1");

    fireEvent.click(screen.getByRole("button", { name: "แจ้งเตือนการโดเนท" }));
    expect(screen.getByText("Realtime Donor")).toBeInTheDocument();
    expect(screen.getByText("+999 ฿")).toBeInTheDocument();
    expect(screen.getByText('"สุดยอดมากครับ!"')).toBeInTheDocument();
  });

  test("ignores duplicate socket donation alert with same id", async () => {
    render(
      <MemoryRouter>
        <NotificationBell username="streamer_realtime" />
      </MemoryRouter>
    );

    await waitFor(() => expect(api.fetchDonationHistory).toHaveBeenCalled());

    act(() => {
      mockSocketInstance.__trigger("donation-alert", {
        id: "duplicate-id",
        donorName: "Donor A",
        amount: 100,
      });
    });

    const badge = await screen.findByTestId("notification-badge");
    expect(badge).toHaveTextContent("1");

    // ส่งซ้ำ id เดิม
    act(() => {
      mockSocketInstance.__trigger("donation-alert", {
        id: "duplicate-id",
        donorName: "Donor A",
        amount: 100,
      });
    });

    expect(screen.getByTestId("notification-badge")).toHaveTextContent("1");
  });

  test("closes dropdown on outside click or pressing Escape key", async () => {
    render(
      <MemoryRouter>
        <div>
          <button data-testid="outside-button">Outside</button>
          <NotificationBell username="streamer_test" />
        </div>
      </MemoryRouter>
    );

    await waitFor(() => expect(api.fetchDonationHistory).toHaveBeenCalled());

    const bellBtn = screen.getByRole("button", { name: "แจ้งเตือนการโดเนท" });
    fireEvent.click(bellBtn);
    expect(screen.getByTestId("notification-dropdown")).toBeInTheDocument();

    // กดปุ่ม Escape
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("notification-dropdown")).not.toBeInTheDocument();

    // เปิดใหม่แล้วคลิกภายนอก
    fireEvent.click(bellBtn);
    expect(screen.getByTestId("notification-dropdown")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId("outside-button"));
    expect(screen.queryByTestId("notification-dropdown")).not.toBeInTheDocument();
  });

  test("closes dropdown when clicking 'ดูประวัติการรับเงินทั้งหมด'", async () => {
    render(
      <MemoryRouter>
        <NotificationBell username="streamer_test" />
      </MemoryRouter>
    );

    await waitFor(() => expect(api.fetchDonationHistory).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "แจ้งเตือนการโดเนท" }));
    const historyLink = await screen.findByText("ดูประวัติการรับเงินทั้งหมด");
    expect(historyLink).toBeInTheDocument();

    fireEvent.click(historyLink);
    expect(screen.queryByTestId("notification-dropdown")).not.toBeInTheDocument();
  });

  test("gracefully handles API errors when fetching donation history", async () => {
    api.fetchDonationHistory.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <MemoryRouter>
        <NotificationBell username="streamer_test" />
      </MemoryRouter>
    );

    // Should not crash and should render empty state
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "แจ้งเตือนการโดเนท" })).toBeInTheDocument();
    });
  });

  test("does not fetch when no token is present", async () => {
    api.getAuthToken.mockReturnValueOnce("");

    render(
      <MemoryRouter>
        <NotificationBell username="streamer_test" />
      </MemoryRouter>
    );

    expect(api.fetchDonationHistory).not.toHaveBeenCalled();
  });
});
