import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HowToUse from "./HowToUse";

describe("HowToUse page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("renders steps and benefits sections with navbar/footer", () => {
    render(
      <MemoryRouter>
        <HowToUse />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /วิธีใช้งาน/ })).toBeInTheDocument();
    expect(screen.getByText("3 ขั้นตอน")).toBeInTheDocument();

    expect(screen.getByText("I")).toBeInTheDocument();
    expect(screen.getByText("II")).toBeInTheDocument();
    expect(screen.getByText("III")).toBeInTheDocument();
    // "เข้าร่วมกับเรา" ปรากฏทั้งใน StepsSection และ CTASection
    expect(
      screen.getAllByText("เข้าร่วมกับเรา").length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("ปรับตามสไตล์")).toBeInTheDocument();
    expect(screen.getByText("รับเงินโดเนทได้เลย")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "สิ่งที่คุณจะได้รับ" })
    ).toBeInTheDocument();
    expect(screen.getByText("บริการรับโดเนทขึ้นหน้าจอ")).toBeInTheDocument();
    expect(screen.getByText("การออกแบบที่ตอบโจทย์")).toBeInTheDocument();
    expect(screen.getByText("ปรับแต่งได้เองตามอิสระ")).toBeInTheDocument();

    // Navbar + Footer + CTASection ถูกเรนเดอร์ครบ
    expect(screen.getAllByRole("link", { name: "หน้าหลัก" }).length).toBe(2);
    expect(screen.getByText("เริ่มใช้งานฟรี")).toBeInTheDocument();
    expect(screen.getByText("บัญชีผู้ใช้")).toBeInTheDocument();
  });
});
