import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Account from "./Account";
import * as api from "../utils/api";

jest.mock("../utils/api", () => {
  const original = jest.requireActual("../utils/api");
  return {
    ...original,
    fetchCurrentUser: jest.fn(),
    updateCurrentUser: jest.fn(),
    changePassword: jest.fn(),
  };
});

describe("Account Page Integration", () => {
  const validPayload = btoa(JSON.stringify({ userId: "123", username: "streamer_alpha" }));
  const validToken = `header.${validPayload}.signature`;

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("redirects to /login when no token exists", async () => {
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Routes>
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<div>เข้าสู่ระบบ</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("เข้าสู่ระบบ")).toBeInTheDocument();
    });
  });

  test("redirects to /login when token is malformed", async () => {
    localStorage.setItem("token", "corrupted.token");

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Routes>
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<div>เข้าสู่ระบบ</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("เข้าสู่ระบบ")).toBeInTheDocument();
    });
  });

  test("renders Account page and populates profile from fetchCurrentUser", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      nickname: "Alpha",
      email: "alpha@donix.app",
      bio: "Pro gamer stream",
      social: { facebook: "https://facebook.com/alpha" },
    });

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Account />
      </MemoryRouter>
    );

    expect(screen.getByText("My Account")).toBeInTheDocument();
    expect(screen.getAllByText("streamer_alpha").length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(api.fetchCurrentUser).toHaveBeenCalled();
    });
  });

  test("saves profile successfully and displays success notification", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      nickname: "Alpha",
    });
    api.updateCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      nickname: "AlphaPrime",
    });

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Account />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Account")).toBeInTheDocument();
    });

    // Switch to User Info tab
    fireEvent.click(screen.getByRole("button", { name: "ข้อมูลผู้ใช้งาน" }));
    expect(screen.getByText("USER INFORMATION")).toBeInTheDocument();

    // Click Save button in User Info
    const saveBtns = screen.getAllByRole("button", { name: /บันทึก/i });
    fireEvent.click(saveBtns[0]);

    await waitFor(() => {
      expect(api.updateCurrentUser).toHaveBeenCalled();
      expect(screen.getByText("บันทึกข้อมูลเรียบร้อยแล้ว")).toBeInTheDocument();
    });
  });

  test("displays error notification when updateCurrentUser fails", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      nickname: "Alpha",
    });
    api.updateCurrentUser.mockRejectedValueOnce(new Error("ข้อมูล nickname ไม่ถูกต้อง"));

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Account />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Account")).toBeInTheDocument();
    });

    // Switch to User Info tab
    fireEvent.click(screen.getByRole("button", { name: "ข้อมูลผู้ใช้งาน" }));
    const saveBtns = screen.getAllByRole("button", { name: /บันทึก/i });
    fireEvent.click(saveBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("ข้อมูล nickname ไม่ถูกต้อง")).toBeInTheDocument();
    });
  });

  test("handles logout by clearing token and navigating to login", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
    });

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Routes>
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<div>เข้าสู่ระบบสำเร็จ</div>} />
        </Routes>
      </MemoryRouter>
    );

    const logoutBtn = screen.getByRole("button", { name: /ออกจากระบบ/i });
    fireEvent.click(logoutBtn);

    expect(localStorage.getItem("token")).toBeNull();
    expect(screen.getByText("เข้าสู่ระบบสำเร็จ")).toBeInTheDocument();
  });

  test("toggles isLive status when clicking switch", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      isLive: false,
    });
    api.updateCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
      isLive: true,
    });

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Account />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("ปิดรับโดเนท (OFFLINE)")).toBeInTheDocument();
    });

    const toggleBtn = screen.getByRole("switch");
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(api.updateCurrentUser).toHaveBeenCalledWith({ isLive: true });
    });
  });

  test("changes password successfully from SecurityTab", async () => {
    localStorage.setItem("token", validToken);
    api.fetchCurrentUser.mockResolvedValueOnce({
      username: "streamer_alpha",
    });
    api.changePassword.mockResolvedValueOnce(null);

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Account />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Account")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "ความปลอดภัย" }));

    const currentPassInput = screen.getByLabelText("รหัสผ่านปัจจุบัน");
    const newPassInput = screen.getByLabelText("รหัสผ่านใหม่");
    const confirmPassInput = screen.getByLabelText("ยืนยันรหัสผ่าน");

    fireEvent.change(currentPassInput, { target: { value: "OldPassword1!" } });
    fireEvent.change(newPassInput, { target: { value: "NewPassword1!" } });
    fireEvent.change(confirmPassInput, { target: { value: "NewPassword1!" } });

    const saveBtns = screen.getAllByRole("button", { name: /บันทึก/i });
    fireEvent.click(saveBtns[0]);

    await waitFor(() => {
      expect(api.changePassword).toHaveBeenCalledWith({
        currentPassword: "OldPassword1!",
        newPassword: "NewPassword1!",
      });
      expect(screen.getByText("เปลี่ยนรหัสผ่านสำเร็จ")).toBeInTheDocument();
    });
  });
});
