import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import DonatePage from "./DonatePage";
import * as api from "../utils/api";

jest.mock("../utils/api", () => {
  const original = jest.requireActual("../utils/api");
  return {
    ...original,
    fetchCurrentUser: jest.fn(),
    updateDonationPageSettings: jest.fn(),
    updateCurrentUser: jest.fn(),
  };
});

describe("DonatePage Integration", () => {
  const validPayload = btoa(JSON.stringify({ userId: "456", username: "streamer_alpha" }));
  const validToken = `header.${validPayload}.signature`;

  const mockDonationPageConfig = {
    welcomeMessage: "ยินดีต้อนรับสู่ช่องของฉัน",
    thankYouMessage: "ขอบคุณสำหรับการโดเนท!",
    minAmount: 20,
    charLimit: 150,
    disableFilter: false,
    filteredWords: ["คำต้องห้าม1", "คำต้องห้าม2"],
    coverImage: null,
    backgroundImage: null,
  };

  const mockSocial = {
    facebook: "https://facebook.com/alpha",
    instagram: "https://instagram.com/alpha",
    youtube: "",
    tiktok: "",
    twitch: "",
    x: "",
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("redirects to /login when token does not exist", async () => {
    render(
      <MemoryRouter initialEntries={["/donate-page"]}>
        <Routes>
          <Route path="/donate-page" element={<DonatePage />} />
          <Route path="/login" element={<div>หน้าล็อกอิน</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("หน้าล็อกอิน")).toBeInTheDocument();
    });
  });

  test("redirects to /login when token is malformed", async () => {
    localStorage.setItem("token", "corrupt.token");

    render(
      <MemoryRouter initialEntries={["/donate-page"]}>
        <Routes>
          <Route path="/donate-page" element={<DonatePage />} />
          <Route path="/login" element={<div>หน้าล็อกอิน</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("หน้าล็อกอิน")).toBeInTheDocument();
    });
  });

  test("loads user donate data on mount from fetchCurrentUser", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      donationPage: mockDonationPageConfig,
      social: mockSocial,
    });

    render(
      <MemoryRouter initialEntries={["/donate-page"]}>
        <Routes>
          <Route path="/donate-page" element={<DonatePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("DONOR URL")).toBeInTheDocument();
      expect(screen.getByText("DONATE PAGE SETTINGS")).toBeInTheDocument();
      expect(screen.getByText("MESSAGES FILTER")).toBeInTheDocument();
      expect(screen.getByText("SOCIAL MEDIA")).toBeInTheDocument();
      expect(screen.getByDisplayValue("ยินดีต้อนรับสู่ช่องของฉัน")).toBeInTheDocument();
    });
  });

  test("saves DecorateSection successfully and shows feedback toast", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      donationPage: mockDonationPageConfig,
      social: mockSocial,
    });
    api.updateDonationPageSettings.mockResolvedValueOnce({
      ...mockDonationPageConfig,
      minAmount: 50,
    });

    render(
      <MemoryRouter initialEntries={["/donate-page"]}>
        <Routes>
          <Route path="/donate-page" element={<DonatePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("ยินดีต้อนรับสู่ช่องของฉัน")).toBeInTheDocument();
    });

    const minAmountInput = screen.getByLabelText("จำนวนเงินขั้นต่ำ");
    fireEvent.change(minAmountInput, { target: { value: "50" } });

    // Click the first save button (DecorateSection)
    const saveButtons = screen.getAllByRole("button", { name: "บันทึก" });
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(api.updateDonationPageSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          minAmount: 50,
        })
      );
      expect(screen.getByText("บันทึกข้อมูลตกแต่งหน้ารับเงินสำเร็จ")).toBeInTheDocument();
    });
  });

  test("handles error when saving DecorateSection fails", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      donationPage: mockDonationPageConfig,
      social: mockSocial,
    });
    api.updateDonationPageSettings.mockRejectedValueOnce(new Error("เซิร์ฟเวอร์ขัดข้อง"));

    render(
      <MemoryRouter initialEntries={["/donate-page"]}>
        <Routes>
          <Route path="/donate-page" element={<DonatePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("ยินดีต้อนรับสู่ช่องของฉัน")).toBeInTheDocument();
    });

    const saveButtons = screen.getAllByRole("button", { name: "บันทึก" });
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("เซิร์ฟเวอร์ขัดข้อง")).toBeInTheDocument();
    });
  });

  test("saves MessageFilterSection successfully and shows feedback toast", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      donationPage: mockDonationPageConfig,
      social: mockSocial,
    });
    api.updateDonationPageSettings.mockResolvedValueOnce({
      ...mockDonationPageConfig,
      charLimit: 200,
    });

    render(
      <MemoryRouter initialEntries={["/donate-page"]}>
        <Routes>
          <Route path="/donate-page" element={<DonatePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("ยินดีต้อนรับสู่ช่องของฉัน")).toBeInTheDocument();
    });

    const charLimitSelect = screen.getByLabelText("จำกัดจำนวนตัวอักษร");
    fireEvent.change(charLimitSelect, { target: { value: "200" } });

    // The second save button is for MessageFilterSection
    const saveButtons = screen.getAllByRole("button", { name: "บันทึก" });
    fireEvent.click(saveButtons[1]);

    await waitFor(() => {
      expect(api.updateDonationPageSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          charLimit: 200,
        })
      );
      expect(screen.getByText("บันทึกตัวกรองข้อความสำเร็จ")).toBeInTheDocument();
    });
  });

  test("handles error when saving MessageFilterSection fails", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      donationPage: mockDonationPageConfig,
      social: mockSocial,
    });
    api.updateDonationPageSettings.mockRejectedValueOnce(new Error("ตัวกรองบันทึกไม่สำเร็จ"));

    render(
      <MemoryRouter initialEntries={["/donate-page"]}>
        <Routes>
          <Route path="/donate-page" element={<DonatePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("ยินดีต้อนรับสู่ช่องของฉัน")).toBeInTheDocument();
    });

    const saveButtons = screen.getAllByRole("button", { name: "บันทึก" });
    fireEvent.click(saveButtons[1]);

    await waitFor(() => {
      expect(screen.getByText("ตัวกรองบันทึกไม่สำเร็จ")).toBeInTheDocument();
    });
  });

  test("saves SocialMediaSection successfully and shows feedback toast", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      donationPage: mockDonationPageConfig,
      social: mockSocial,
    });
    api.updateCurrentUser.mockResolvedValueOnce({
      social: { ...mockSocial, twitch: "https://twitch.tv/alpha" },
    });

    render(
      <MemoryRouter initialEntries={["/donate-page"]}>
        <Routes>
          <Route path="/donate-page" element={<DonatePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("ยินดีต้อนรับสู่ช่องของฉัน")).toBeInTheDocument();
    });

    // The third save button is for SocialMediaSection
    const saveButtons = screen.getAllByRole("button", { name: "บันทึก" });
    fireEvent.click(saveButtons[2]);

    await waitFor(() => {
      expect(api.updateCurrentUser).toHaveBeenCalledWith(
        expect.objectContaining({
          social: expect.any(Object),
        })
      );
      expect(screen.getByText("บันทึกโซเชียลมีเดียสำเร็จ")).toBeInTheDocument();
    });
  });

  test("handles error when saving SocialMediaSection fails", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      donationPage: mockDonationPageConfig,
      social: mockSocial,
    });
    api.updateCurrentUser.mockRejectedValueOnce(new Error("บันทึกโซเชียลมีเดียล้มเหลว"));

    render(
      <MemoryRouter initialEntries={["/donate-page"]}>
        <Routes>
          <Route path="/donate-page" element={<DonatePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("ยินดีต้อนรับสู่ช่องของฉัน")).toBeInTheDocument();
    });

    const saveButtons = screen.getAllByRole("button", { name: "บันทึก" });
    fireEvent.click(saveButtons[2]);

    await waitFor(() => {
      expect(screen.getByText("บันทึกโซเชียลมีเดียล้มเหลว")).toBeInTheDocument();
    });
  });

  test("logs out when clicking logout button in Sidebar", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      donationPage: mockDonationPageConfig,
      social: mockSocial,
    });

    render(
      <MemoryRouter initialEntries={["/donate-page"]}>
        <Routes>
          <Route path="/donate-page" element={<DonatePage />} />
          <Route path="/login" element={<div>ออกจากระบบสำเร็จ</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("DONOR URL")).toBeInTheDocument();
    });

    const logoutBtn = screen.getByText(/ออกจากระบบ/i);
    fireEvent.click(logoutBtn);

    expect(localStorage.getItem("token")).toBeNull();
    await waitFor(() => {
      expect(screen.getByText("ออกจากระบบสำเร็จ")).toBeInTheDocument();
    });
  });
});
