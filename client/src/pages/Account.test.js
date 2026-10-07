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
});
