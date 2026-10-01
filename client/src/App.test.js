import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders landing page", () => {
  render(<App />);
  const hero = screen.getAllByText(/Next-Gen Streaming Donations/i);
  expect(hero.length).toBeGreaterThan(0);
});

describe("App routing", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: { username: "streamer_pro" } }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.history.pushState({}, "", "/");
  });

  it("แสดงหน้า 404 เมื่อเข้าเส้นทางที่ไม่มีอยู่", () => {
    window.history.pushState({}, "", "/no-such-page");

    render(<App />);

    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("พาผู้ใช้ไปหน้า login เมื่อเปิด /account โดยไม่มี token", () => {
    window.history.pushState({}, "", "/account");

    render(<App />);

    expect(
      screen.getByRole("heading", { name: /เข้าสู่ระบบ/i }),
    ).toBeInTheDocument();
  });

  it("แสดงหน้าบัญชีผู้ใช้เมื่อมี token", () => {
    const payload = btoa(JSON.stringify({ username: "streamer_pro" }));
    localStorage.setItem("token", `header.${payload}.signature`);
    window.history.pushState({}, "", "/account");

    render(<App />);

    expect(screen.getAllByText(/บัญชีผู้ใช้/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("streamer_pro").length).toBeGreaterThan(0);
  });
});
