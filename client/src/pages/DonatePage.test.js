import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DonatePage from "./DonatePage";

const makeToken = (payload) =>
  `header.${btoa(JSON.stringify(payload))}.signature`;

const renderDonatePage = () =>
  render(
    <MemoryRouter initialEntries={["/donate-page"]}>
      <Routes>
        <Route path="/donate-page" element={<DonatePage />} />
        <Route path="/login" element={<div>หน้าเข้าสู่ระบบ</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("DonatePage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("เรนเดอร์หน้ารับเงินพร้อมชื่อผู้ใช้จาก token และพื้นหลัง gradient", () => {
    localStorage.setItem("token", makeToken({ username: "streamer_pro" }));

    const { container } = renderDonatePage();

    expect(screen.getAllByText("หน้ารับเงิน").length).toBeGreaterThan(0);
    expect(screen.getAllByText("streamer_pro").length).toBeGreaterThan(0);
    expect(
      container.querySelector(".pointer-events-none.fixed.inset-0"),
    ).toBeInTheDocument();
  });

  it("แสดงค่า Test เมื่อ payload ไม่มี username", () => {
    localStorage.setItem("token", makeToken({}));

    renderDonatePage();

    expect(screen.getAllByText(/Test/).length).toBeGreaterThan(0);
  });

  it("ล็อกเอาต์แล้วกลับหน้า login", async () => {
    localStorage.setItem("token", makeToken({ username: "u" }));

    renderDonatePage();
    fireEvent.click(screen.getByRole("button", { name: /ออกจากระบบ/i }));

    await waitFor(() => expect(localStorage.getItem("token")).toBeNull());
    expect(screen.getByText("หน้าเข้าสู่ระบบ")).toBeInTheDocument();
  });
});
