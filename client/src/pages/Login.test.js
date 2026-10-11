import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Login from "./Login";
import * as apiModule from "../utils/api";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("Login Page", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("renders Login form with fields and Google button", () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByRole("heading", { name: "เข้าสู่ระบบ" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Streamer@Donix.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("*************")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "เข้าสู่ระบบ" })).toBeInTheDocument();
    expect(screen.getByText("ดำเนินการต่อด้วย Google")).toBeInTheDocument();
    expect(screen.queryByText(/Youtube/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Twitch/i)).not.toBeInTheDocument();
  });

  test("handles successful email/password login", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: "mock_jwt_email_login",
        user: { id: "123", username: "streamer1" },
      }),
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Streamer@Donix.com"), {
      target: { value: "test@donix.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("*************"), {
      target: { value: "Password123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: "เข้าสู่ระบบ" }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("mock_jwt_email_login");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("displays error message when login fails", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        message: "Email หรือรหัสผ่านไม่ถูกต้อง",
      }),
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Streamer@Donix.com"), {
      target: { value: "wrong@donix.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("*************"), {
      target: { value: "WrongPass" },
    });

    fireEvent.click(screen.getByRole("button", { name: "เข้าสู่ระบบ" }));

    expect(await screen.findByText("Email หรือรหัสผ่านไม่ถูกต้อง")).toBeInTheDocument();
  });

  test("handles Google OAuth login error callback", async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Click Google button to trigger modal
    fireEvent.click(screen.getByText("ดำเนินการต่อด้วย Google"));

    // Mock fetch error for demo login
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Google Auth Failed" }),
    });

    fireEvent.click(screen.getByText(/เข้าสู่ระบบด้วย Google \(Demo Mode\)/i));

    expect(await screen.findByText("Google Auth Failed")).toBeInTheDocument();
  });

  test("handles Google OAuth login success", async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText("ดำเนินการต่อด้วย Google"));

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: "mock_jwt_google_success",
        user: { id: "g1", username: "googler" },
      }),
    });

    fireEvent.click(screen.getByText(/เข้าสู่ระบบด้วย Google \(Demo Mode\)/i));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("mock_jwt_google_success");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });
});
