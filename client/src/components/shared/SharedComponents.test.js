import { render, screen, fireEvent } from "@testing-library/react";
import AmbientBackground from "./AmbientBackground";
import SocialMediaForm from "./SocialMediaForm";
import { socialPlatforms } from "./socialPlatforms";
import {
  fieldClassName,
  fieldLabelClassName,
  fieldWrapperClassName,
} from "./socialFieldStyles";

describe("shared components", () => {
  describe("AmbientBackground", () => {
    it("เรนเดอร์ glow 3 ชั้นแบบเบลอร์", () => {
      const { container } = render(<AmbientBackground />);

      const glows = Array.from(container.firstChild.children);
      expect(glows).toHaveLength(3);
      glows.forEach((glow) => {
        expect(glow.className).toContain("rounded-full");
        expect(glow.className).toContain("blur-");
      });
    });
  });

  describe("socialPlatforms", () => {
    it("มีแพลตฟอร์มครบ 6 แห่งพร้อม key, label และ icon", () => {
      expect(socialPlatforms).toHaveLength(6);
      expect(socialPlatforms.map((p) => p.key)).toEqual([
        "facebook",
        "instagram",
        "youtube",
        "tiktok",
        "twitch",
        "x",
      ]);
      socialPlatforms.forEach((platform) => {
        expect(typeof platform.label).toBe("string");
        expect(platform.icon).toBeTruthy();
      });
    });
  });

  describe("SocialMediaForm", () => {
    it("เรนเดอร์ช่องกรอกครบทุกแพลตฟอร์ม", () => {
      render(<SocialMediaForm />);

      expect(screen.getByText("FACEBOOK")).toBeInTheDocument();
      expect(screen.getByText("INSTAGRAM")).toBeInTheDocument();
      expect(screen.getAllByPlaceholderText("ยังไม่ได้เชื่อมต่อ")).toHaveLength(
        6,
      );
    });

    it("บันทึกค่าที่พิมพ์ลง state ของช่องนั้น", () => {
      render(<SocialMediaForm />);

      const [facebook] = screen.getAllByPlaceholderText("ยังไม่ได้เชื่อมต่อ");
      fireEvent.change(facebook, { target: { value: "donix" } });

      expect(facebook).toHaveValue("donix");
    });
  });

  describe("field style tokens", () => {
    it("ส่งออก class name สำหรับช่องกรอกข้อมูล", () => {
      expect(fieldClassName).toContain("rounded-xl");
      expect(fieldLabelClassName).toContain("font-semibold");
      expect(fieldWrapperClassName).toContain("flex-col");
    });
  });
});
