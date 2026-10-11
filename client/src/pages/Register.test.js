import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Register from "./Register";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("Register Page", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("renders Register form with fields and Google button", () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.getByRole("heading", { name: "สมัครสมาชิก" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Streamer")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Streamer@Donix.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("อย่างน้อย 8 ตัวอักษร")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "สมัครสมาชิก" })).toBeInTheDocument();
    expect(screen.getByText("ดำเนินการต่อด้วย Google")).toBeInTheDocument();
    expect(screen.queryByText(/Youtube/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Twitch/i)).not.toBeInTheDocument();
  });

  test("requires agreement checkbox before Google OAuth", () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Click Google OAuth without checking agreement checkbox
    fireEvent.click(screen.getByText("ดำเนินการต่อด้วย Google"));

    expect(screen.getByText("กรุณายอมรับข้อตกลงก่อน")).toBeInTheDocument();
    expect(screen.queryByText("Google OAuth Service")).not.toBeInTheDocument();
  });

  test("allows Google OAuth when agreement checkbox is checked", async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Check agreement checkbox
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    // Click Google OAuth button
    fireEvent.click(screen.getByText("ดำเนินการต่อด้วย Google"));

    // Modal should appear
    expect(screen.getByText("Google OAuth Service")).toBeInTheDocument();

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: "mock_jwt_register_google",
        user: { id: "reg1", username: "new_streamer" },
      }),
    });

    fireEvent.click(screen.getByText(/เข้าสู่ระบบด้วย Google \(Demo Mode\)/i));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("mock_jwt_register_google");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("handles Google OAuth error on Register page", async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByText("ดำเนินการต่อด้วย Google"));

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "เกิดข้อผิดพลาดในการสมัครด้วย Google" }),
    });

    fireEvent.click(screen.getByText(/เข้าสู่ระบบด้วย Google \(Demo Mode\)/i));

    expect(
      await screen.findByText("เกิดข้อผิดพลาดในการสมัครด้วย Google")
    ).toBeInTheDocument();
  });

  test("opens and closes Privacy Policy and Terms modals", () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Privacy Policy
    fireEvent.click(screen.getByText("นโยบายความเป็นส่วนตัว"));
    expect(screen.getByText("เนื้อหานโยบายความเป็นส่วนตัวของ DONIX")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ปิด" }));
    expect(screen.queryByText("เนื้อหานโยบายความเป็นส่วนตัวของ DONIX")).not.toBeInTheDocument();

    // Terms of Service
    fireEvent.click(screen.getByText("เงื่อนไขการให้บริการ"));
    expect(screen.getByText("เนื้อหาเงื่อนไขการให้บริการของ DONIX")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ปิด" }));
    expect(screen.queryByText("เนื้อหาเงื่อนไขการให้บริการของ DONIX")).not.toBeInTheDocument();
  });
});
