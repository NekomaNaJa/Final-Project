import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import MainPage from "./MainPage";
import PublicProfilePage from "./PublicProfilePage";
import * as api from "../utils/api";

jest.mock("../utils/api", () => {
  const original = jest.requireActual("../utils/api");
  return {
    ...original,
    fetchPublicStreamers: jest.fn(),
    fetchPublicStreamer: jest.fn(),
  };
});

describe("MainPage & PublicProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders Features with emojis/icons and StreamerList with dynamic registered streamers", async () => {
    api.fetchPublicStreamers.mockResolvedValueOnce([
      {
        username: "Test3",
        nickname: "Test3",
        avatar: "https://example.com/avatar3.png",
        isLive: true,
      },
      {
        username: "AlphaGamer",
        nickname: "",
        avatar: "",
        isLive: false,
      },
    ]);

    render(
      <MemoryRouter>
        <MainPage />
      </MemoryRouter>
    );

    // 1. Verify Feature Showcase emojis and titles
    expect(screen.getByText("ค่าธรรมเนียม 0%")).toBeInTheDocument();
    expect(screen.getByText("💸")).toBeInTheDocument();
    expect(screen.getByText("ภารกิจที่คุณสร้างขึ้นได้เอง")).toBeInTheDocument();
    expect(screen.getByText("🎯")).toBeInTheDocument();
    expect(screen.getByText("ปรับแต่งโดเนทให้ถูกใจคุณ")).toBeInTheDocument();
    expect(screen.getByText("🎨")).toBeInTheDocument();

    // 2. Verify Streamer Showcase heading & subtitle
    expect(screen.getByText("Streamer ที่น่าสนใจ")).toBeInTheDocument();

    // 3. Verify dynamic registered streamers render with links to /:username/profile
    await waitFor(() => {
      expect(screen.getByText("Test3")).toBeInTheDocument();
      expect(screen.getByText("@Test3")).toBeInTheDocument();
      expect(screen.getByText("AlphaGamer")).toBeInTheDocument();
      expect(screen.getByText("LIVE")).toBeInTheDocument();
    });

    const cardLink = screen.getByTestId("streamer-card-Test3");
    expect(cardLink).toHaveAttribute("href", "/Test3/profile");
  });

  test("renders empty state in StreamerList when no streamers are returned", async () => {
    api.fetchPublicStreamers.mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <MainPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("ยังไม่มีสตรีมเมอร์ในระบบขณะนี้")).toBeInTheDocument();
    });
  });

  test("renders read-only PublicProfilePage without ManageAccount, UserInfo, or Security tabs", async () => {
    api.fetchPublicStreamer.mockResolvedValueOnce({
      username: "Test3",
      nickname: "Test3",
      avatar: "https://example.com/test3.png",
      bio: "สตรีมเมอร์สายฮา",
      isLive: false,
      createdAt: "2026-10-08T00:00:00.000Z",
      totalAmount: 1500,
      social: {
        facebook: "https://facebook.com/Test3Channel",
        youtube: "Test3Official",
      },
    });

    render(
      <MemoryRouter initialEntries={["/Test3/profile"]}>
        <Routes>
          <Route path="/:username/profile" element={<PublicProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Streamer Profile")).toBeInTheDocument();
    });

    expect(screen.getByText("สตรีมเมอร์สายฮา")).toBeInTheDocument();
    expect(screen.getByText("฿1,500.00")).toBeInTheDocument();

    // Connected social links are clickable and show green badge
    const fbLink = screen.getByTestId("social-handle-facebook");
    expect(fbLink).toHaveTextContent("@Test3Channel");
    expect(fbLink).toHaveAttribute("href", "https://facebook.com/Test3Channel");
    expect(screen.getByTestId("social-status-facebook")).toHaveTextContent("เชื่อมต่อแล้ว");

    const ytLink = screen.getByTestId("social-handle-youtube");
    expect(ytLink).toHaveTextContent("@Test3Official");
    expect(ytLink).toHaveAttribute("href", "https://youtube.com/@Test3Official");

    // Verify Read-Only restrictions: NO ManageAccountCard, NO UserInfo/Security tabs, NO edit/delete/connect buttons
    expect(screen.queryByText("จัดการบัญชี")).not.toBeInTheDocument();
    expect(screen.queryByText("ข้อมูลผู้ใช้งาน")).not.toBeInTheDocument();
    expect(screen.queryByText("ความปลอดภัย")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("เปลี่ยนรูปโปรไฟล์")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("ลบรูปโปรไฟล์")).not.toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /เชื่อมต่อ/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /บันทึก/i })).not.toBeInTheDocument();
  });

  test("renders not-found state on PublicProfilePage when streamer does not exist", async () => {
    api.fetchPublicStreamer.mockRejectedValueOnce(new Error("ไม่พบสตรีมเมอร์นี้"));

    render(
      <MemoryRouter initialEntries={["/UnknownUser/profile"]}>
        <Routes>
          <Route path="/:username/profile" element={<PublicProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("public-profile-not-found")).toBeInTheDocument();
      expect(screen.getByText("ไม่พบสตรีมเมอร์นี้")).toBeInTheDocument();
    });
  });

  test("renders Footer user account links with correct routes", async () => {
    const payload = btoa(JSON.stringify({ username: "LoggedUser" }));
    localStorage.setItem("token", `header.${payload}.signature`);
    api.fetchPublicStreamers.mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <MainPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("บัญชีผู้ใช้")).toBeInTheDocument();
    });

    const loginLinks = screen.getAllByRole("link", { name: "เข้าสู่ระบบ" });
    expect(loginLinks[0]).toHaveAttribute("href", "/login");

    const registerLinks = screen.getAllByRole("link", { name: "สมัครสมาชิก" });
    expect(registerLinks[0]).toHaveAttribute("href", "/register");

    const accountManageLink = screen.getByRole("link", { name: "การจัดการบัญชี" });
    expect(accountManageLink).toHaveAttribute("href", "/account");

    const personalDonateLink = screen.getByRole("link", { name: "หน้ารับเงินส่วนตัว" });
    expect(personalDonateLink).toHaveAttribute("href", "/LoggedUser");

    localStorage.clear();
  });
});
