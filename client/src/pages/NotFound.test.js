import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFound from "./NotFound";

describe("NotFound page", () => {
  it("แสดงรหัส 404 และคำอธิบาย", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(
      screen.getByText("ไม่พบหน้าที่คุณกำลังมองหา"),
    ).toBeInTheDocument();
  });

  it("มีลิงก์กลับหน้าหลัก", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "กลับหน้าแรก" });
    expect(link).toHaveAttribute("href", "/");
  });
});
