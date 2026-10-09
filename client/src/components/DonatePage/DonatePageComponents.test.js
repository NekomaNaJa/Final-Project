import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import DonatePageLink from "./DonatePageLink";
import RichTextField from "./RichTextField";
import ImageUploadBox from "./ImageUploadBox";
import DecorateSection from "./DecorateSection";
import MessageFilterSection from "./MessageFilterSection";
import SocialMediaSection from "./SocialMediaSection";
import DonatePage from "../../pages/DonatePage";

jest.mock("../../utils/api", () => {
  const original = jest.requireActual("../../utils/api");
  return {
    ...original,
    fetchCurrentUser: jest.fn().mockResolvedValue({
      username: "StreamerMaster",
      donationPage: {
        welcomeMessage: "ยินดีต้อนรับ",
        thankYouMessage: "ขอบคุณครับ",
        minAmount: 10,
        charLimit: 100,
        disableFilter: false,
        filteredWords: ["คำหยาบ", "สแปม"],
        coverImage: null,
        backgroundImage: null,
      },
      social: {},
    }),
    updateDonationPageSettings: jest.fn().mockResolvedValue({}),
    updateCurrentUser: jest.fn().mockResolvedValue({}),
  };
});

describe("DonatePage Components & Page", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("DonatePageLink", () => {
    test("renders link and handles copy and external link", async () => {
      render(<DonatePageLink username="StreamerHero" />);
      expect(screen.getByText("DONOR URL")).toBeInTheDocument();
      expect(screen.getByDisplayValue("http://donix.app/StreamerHero")).toBeInTheDocument();

      const copyBtn = screen.getByTitle("คัดลอกลิงก์");
      fireEvent.click(copyBtn);
      expect(await screen.findByText("คัดลอกลิงก์ไปยังคลิปบอร์ดแล้ว!")).toBeInTheDocument();

      const previewLink = screen.getByText("ดูตัวอย่างหน้ารับเงินของคุณได้ที่นี่").closest("a");
      expect(previewLink).toHaveAttribute("href", "/StreamerHero");
    });
  });

  describe("RichTextField", () => {
    test("renders label and handles typing and toolbar formatting toggles", () => {
      const handleChange = jest.fn();
      render(
        <RichTextField
          label="ข้อความแนะนำตัว"
          value="สวัสดีครับ"
          onChange={handleChange}
          placeholder="พิมพ์ข้อความ..."
        />
      );

      expect(screen.getByLabelText("ข้อความแนะนำตัว")).toBeInTheDocument();

      const textarea = screen.getByPlaceholderText("พิมพ์ข้อความ...");
      fireEvent.change(textarea, { target: { value: "ข้อความใหม่" } });
      expect(handleChange).toHaveBeenCalledWith("ข้อความใหม่");

      const boldBtn = screen.getByTitle("ตัวหนา (Bold)");
      fireEvent.click(boldBtn);

      const italicBtn = screen.getByTitle("ตัวเอียง (Italic)");
      fireEvent.click(italicBtn);

      const headingBtn = screen.getByTitle("หัวข้อ (Heading)");
      fireEvent.click(headingBtn);
    });
  });

  describe("ImageUploadBox", () => {
    test("handles valid image file selection and drop", () => {
      const handleSelect = jest.fn();
      global.URL.createObjectURL = jest.fn(() => "blob:http://localhost/test-image");

      const { container } = render(
        <ImageUploadBox label="รูปภาพหน้าปก" onImageSelect={handleSelect} />
      );

      const input = container.querySelector('input[type="file"]');
      const file = new File(["image-bytes"], "cover.jpg", { type: "image/jpeg" });
      fireEvent.change(input, { target: { files: [file] } });

      expect(handleSelect).toHaveBeenCalledWith(
        file,
        expect.stringMatching(/^(data:image|blob:)/)
      );

      const removeBtn = container.querySelector('button[title="ลบรูปภาพ"]');
      if (removeBtn) {
        fireEvent.click(removeBtn);
        expect(handleSelect).toHaveBeenCalledWith(null, null);
      }
    });

    test("handles drag, dragover, dragleave and drop events", () => {
      const handleSelect = jest.fn();
      global.URL.createObjectURL = jest.fn(() => "blob:http://localhost/drag-image");

      const { container } = render(
        <ImageUploadBox label="พื้นหลัง" onImageSelect={handleSelect} />
      );

      const dropZone = container.querySelector(".cursor-pointer");
      fireEvent.dragOver(dropZone);
      fireEvent.dragLeave(dropZone);

      const file = new File(["bytes"], "bg.png", { type: "image/png" });
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });
      expect(handleSelect).toHaveBeenCalled();
    });

    test("rejects invalid file type with alert", () => {
      window.alert = jest.fn();
      const { container } = render(<ImageUploadBox label="ทดสอบ" />);

      const input = container.querySelector('input[type="file"]');
      const badFile = new File(["text"], "data.txt", { type: "text/plain" });
      fireEvent.change(input, { target: { files: [badFile] } });

      expect(window.alert).toHaveBeenCalledWith(
        "รองรับเฉพาะไฟล์รูปภาพประเภท jpg, png, gif เท่านั้น"
      );
    });
  });

  describe("DecorateSection", () => {
    test("renders settings card and saves decoration config", () => {
      render(<DecorateSection />);
      expect(screen.getByText("DONATE PAGE SETTINGS")).toBeInTheDocument();

      const minAmountInput = screen.getByLabelText("จำนวนเงินขั้นต่ำ");
      fireEvent.change(minAmountInput, { target: { value: "50" } });
      expect(minAmountInput.value).toBe("50");

      const saveBtn = screen.getByRole("button", { name: /บันทึก/i });
      fireEvent.click(saveBtn);

      const saved = JSON.parse(localStorage.getItem("donix_donate_config"));
      expect(saved.minAmount).toBe(50);
    });
  });

  describe("MessageFilterSection", () => {
    test("changes char limit and manages custom filtered words", () => {
      render(<MessageFilterSection />);
      expect(screen.getByText("MESSAGES FILTER")).toBeInTheDocument();

      const charSelect = screen.getByLabelText("จำกัดจำนวนตัวอักษร");
      fireEvent.change(charSelect, { target: { value: "200" } });
      expect(charSelect.value).toBe("200");

      const wordInput = screen.getByPlaceholderText(
        "พิมพ์คำที่ไม่ต้องการและกด Enter หรือปุ่มเพิ่ม"
      );
      fireEvent.change(wordInput, { target: { value: "badword" } });
      fireEvent.keyDown(wordInput, { key: "Enter" });

      expect(screen.getByText("badword")).toBeInTheDocument();

      // Add via button
      fireEvent.change(wordInput, { target: { value: "anotherbad" } });
      const addBtn = screen.getByRole("button", { name: /เพิ่ม/i });
      fireEvent.click(addBtn);
      expect(screen.getByText("anotherbad")).toBeInTheDocument();

      const saveBtn = screen.getByRole("button", { name: /บันทึก/i });
      fireEvent.click(saveBtn);
    });
  });

  describe("SocialMediaSection", () => {
    test("renders social platforms and allows saving links", () => {
      render(<SocialMediaSection />);
      expect(screen.getByText("SOCIAL MEDIA")).toBeInTheDocument();

      const inputs = screen.getAllByPlaceholderText("ยังไม่ได้เชื่อมต่อ");
      fireEvent.change(inputs[0], { target: { value: "https://facebook.com/mychannel" } });
      expect(inputs[0].value).toBe("https://facebook.com/mychannel");

      const saveBtn = screen.getByRole("button", { name: /บันทึก/i });
      fireEvent.click(saveBtn);
    });
  });

  describe("DonatePage (Full Page)", () => {
    test("renders full donate page with authenticated user from token", () => {
      const mockPayload = btoa(JSON.stringify({ username: "StreamerMaster" }));
      localStorage.setItem("token", `header.${mockPayload}.signature`);

      render(
        <BrowserRouter>
          <DonatePage />
        </BrowserRouter>
      );

      expect(screen.getByText("DONOR URL")).toBeInTheDocument();
      expect(screen.getByText("DONATE PAGE SETTINGS")).toBeInTheDocument();
    });

    test("handles logout on DonatePage", () => {
      const mockPayload = btoa(JSON.stringify({ username: "StreamerMaster" }));
      localStorage.setItem("token", `header.${mockPayload}.signature`);

      render(
        <BrowserRouter>
          <DonatePage />
        </BrowserRouter>
      );

      const logoutBtn = screen.getByText("ออกจากระบบ");
      fireEvent.click(logoutBtn);
      expect(localStorage.getItem("token")).toBeNull();
    });
  });
});
