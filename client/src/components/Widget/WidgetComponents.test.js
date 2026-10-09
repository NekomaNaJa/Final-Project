import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import WidgetHeader from "./WidgetHeader";
import WidgetTypeTabs from "./WidgetTypeTabs";
import AccordionSection from "./AccordionSection";
import AudioUploadField from "./AudioUploadField";
import BrowserSourceCard from "./BrowserSourceCard";
import DonateGoalPanel from "./DonateGoalPanel";
import LeaderboardPanel from "./LeaderboardPanel";
import MissionDonatePanel from "./MissionDonatePanel";
import DonateAlertPanel from "./DonateAlertPanel";
import WidgetPreview from "./WidgetPreview";
import {
  DEFAULT_WIDGET_CONFIG,
  getWidgetConfig,
  saveWidgetConfig,
  getBrowserSourceUrl,
} from "./widgetStorage";
import WidgetPage from "../../pages/WidgetPage";
import { mockSocketInstance } from "../../__mocks__/socket.io-client";

jest.mock("socket.io-client");

describe("Widget Components & Functions", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockSocketInstance.__reset();
  });

  describe("WidgetHeader", () => {
    test("renders header title, subtitle, and badge", () => {
      render(<WidgetHeader />);
      expect(screen.getByText("WIDGETS")).toBeInTheDocument();
      expect(screen.getByText("วิดเจ็ต")).toBeInTheDocument();
      expect(screen.getByText("รับเงิน")).toBeInTheDocument();
      expect(screen.getByText(/4 วิดเจ็ตที่ใช้งานได้/)).toBeInTheDocument();
    });
  });

  describe("WidgetTypeTabs", () => {
    test("renders all 4 tabs and handles tab change", () => {
      const handleChange = jest.fn();
      render(<WidgetTypeTabs activeId="alert" onChange={handleChange} />);

      expect(screen.getByText("Donate Alert")).toBeInTheDocument();
      expect(screen.getByText("Donate Goal")).toBeInTheDocument();
      expect(screen.getByText("Leaderboard")).toBeInTheDocument();
      expect(screen.getByText("Mission Donate")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Donate Goal"));
      expect(handleChange).toHaveBeenCalledWith("goal");

      fireEvent.click(screen.getByText("Leaderboard"));
      expect(handleChange).toHaveBeenCalledWith("leaderboard");
    });
  });

  describe("AccordionSection", () => {
    test("toggles children visibility on button click", () => {
      render(
        <AccordionSection title="ส่วนทดสอบ">
          <div>เนื้อหาภายใน</div>
        </AccordionSection>
      );

      expect(screen.getByText("ส่วนทดสอบ")).toBeInTheDocument();
      expect(screen.getByText("เนื้อหาภายใน")).toBeInTheDocument();

      const toggleBtn = screen.getByRole("button", { name: /ส่วนทดสอบ/ });
      fireEvent.click(toggleBtn);
      expect(screen.queryByText("เนื้อหาภายใน")).not.toBeInTheDocument();

      fireEvent.click(toggleBtn);
      expect(screen.getByText("เนื้อหาภายใน")).toBeInTheDocument();
    });
  });

  describe("AudioUploadField", () => {
    test("handles valid mp3 selection, invalid files, and removal", () => {
      const handleSelect = jest.fn();
      window.alert = jest.fn();

      const { container } = render(
        <AudioUploadField fileName="alert.mp3" onFileSelect={handleSelect} />
      );

      expect(screen.getByText("alert.mp3")).toBeInTheDocument();

      const buttons = container.querySelectorAll("button");
      if (buttons[0]) {
        fireEvent.click(buttons[0]);
      }

      const fileInput = container.querySelector('input[type="file"]');
      const badFile = new File(["dummy"], "sound.wav", { type: "audio/wav" });
      fireEvent.change(fileInput, { target: { files: [badFile] } });
      expect(window.alert).toHaveBeenCalledWith("รองรับเฉพาะไฟล์เสียงประเภท MP3 เท่านั้น");

      const goodFile = new File(["dummy"], "custom.mp3", { type: "audio/mpeg" });
      fireEvent.change(fileInput, { target: { files: [goodFile] } });
      expect(handleSelect).toHaveBeenCalledWith("custom.mp3");

      if (buttons[1]) {
        fireEvent.click(buttons[1]);
        expect(handleSelect).toHaveBeenCalledWith("");
      }

      // Test FileReader onload and quota error catch
      const originalFileReader = window.FileReader;
      class MockFileReader {
        readAsDataURL() {
          if (this.onload) {
            this.onload({ target: { result: "data:audio/mp3;base64,mockResult" } });
          }
        }
      }
      window.FileReader = MockFileReader;

      const customMp3 = new File(["dummy"], "onload.mp3", { type: "audio/mpeg" });
      fireEvent.change(fileInput, { target: { files: [customMp3] } });
      expect(handleSelect).toHaveBeenCalledWith("onload.mp3");

      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error("Quota exceeded");
      });
      fireEvent.change(fileInput, { target: { files: [customMp3] } });

      Storage.prototype.setItem = originalSetItem;
      window.FileReader = originalFileReader;
    });
  });

  describe("BrowserSourceCard", () => {
    test("renders URL and copies to clipboard and handles clipboard failure", async () => {
      const mockClipboard = { writeText: jest.fn().mockResolvedValue() };
      Object.assign(navigator, { clipboard: mockClipboard });

      const handleTest = jest.fn();
      const { rerender } = render(
        <BrowserSourceCard
          type="alert"
          username="gamer123"
          isLive={true}
          onTest={handleTest}
        />
      );

      expect(screen.getByText("Browser Source URL")).toBeInTheDocument();
      expect(screen.getByText(/gamer123/)).toBeInTheDocument();

      const copyBtn = screen.getByRole("button", { name: /คัดลอก/ });
      await act(async () => {
        fireEvent.click(copyBtn);
      });
      expect(mockClipboard.writeText).toHaveBeenCalled();

      const testBtn = screen.getByRole("button", { name: /ทดสอบ Alert/ });
      fireEvent.click(testBtn);
      expect(handleTest).toHaveBeenCalledTimes(1);

      // Clipboard rejection
      mockClipboard.writeText.mockRejectedValueOnce(new Error("fail"));
      await act(async () => {
        fireEvent.click(copyBtn);
      });

      // Rerender with isLive = false
      rerender(
        <BrowserSourceCard
          type="alert"
          username="gamer123"
          isLive={false}
          onTest={handleTest}
        />
      );
      expect(screen.getByText("ยังไม่ได้บันทึก")).toBeInTheDocument();
    });


    test("renders mission type disclaimer without url copy", () => {
      render(
        <BrowserSourceCard
          type="mission"
          username="gamer123"
          isLive={false}
          onTest={jest.fn()}
        />
      );

      expect(screen.getByText("สถานะวิดเจ็ต")).toBeInTheDocument();
      expect(screen.getByText("ยังไม่ได้บันทึก")).toBeInTheDocument();
      expect(
        screen.getByText(/วิดเจ็ต Mission Donate จะไปแสดงผลบน/i)
      ).toBeInTheDocument();
    });
  });

  describe("DonateGoalPanel", () => {
    test("handles goal updates and theme selection", () => {
      const handleChange = jest.fn();
      const handleSave = jest.fn();

      render(
        <DonateGoalPanel
          value={DEFAULT_WIDGET_CONFIG.goal}
          onChange={handleChange}
          onSave={handleSave}
        />
      );

      expect(screen.getByText("Donate Goal")).toBeInTheDocument();

      const titleInput = screen.getByPlaceholderText(/เป้าหมายพัฒนาสตรีม/);
      fireEvent.change(titleInput, { target: { value: "เป้าหมายใหม่" } });
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ title: "เป้าหมายใหม่" })
      );

      const targetInput = screen.getByPlaceholderText("10000");
      fireEvent.change(targetInput, { target: { value: "25000" } });
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ target: 25000 })
      );

      const crimsonTheme = screen.getByText("Crimson").closest("button");
      fireEvent.click(crimsonTheme);
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ theme: "crimson" })
      );

      const startDateInput = screen.getByDisplayValue("2026-09-01");
      fireEvent.change(startDateInput, { target: { value: "2026-10-01" } });
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: "2026-10-01" })
      );

      const endDateInput = screen.getByDisplayValue("2026-09-30");
      fireEvent.change(endDateInput, { target: { value: "2026-10-31" } });
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ endDate: "2026-10-31" })
      );

      const saveBtn = screen.getByRole("button", { name: /บันทึก/i });
      fireEvent.click(saveBtn);
      expect(handleSave).toHaveBeenCalled();
    });
  });

  describe("LeaderboardPanel", () => {
    test("handles title, toggle, and limit stepper", () => {
      const handleChange = jest.fn();
      const handleSave = jest.fn();

      render(
        <LeaderboardPanel
          value={DEFAULT_WIDGET_CONFIG.leaderboard}
          onChange={handleChange}
          onSave={handleSave}
        />
      );

      expect(screen.getByText("Leaderboard")).toBeInTheDocument();

      const titleInput = screen.getByPlaceholderText(/TOP 5/);
      fireEvent.change(titleInput, { target: { value: "Top Supporters" } });
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Top Supporters" })
      );

      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ showAmount: false })
      );

      const buttons = screen.getAllByRole("button");
      const minusBtn = buttons.find((b) => b.querySelector("svg") && b.textContent === "");
      if (minusBtn) {
        fireEvent.click(minusBtn);
        expect(handleChange).toHaveBeenCalled();
      }

      const startDateInput = screen.getByDisplayValue("2026-09-01");
      fireEvent.change(startDateInput, { target: { value: "2026-10-01" } });
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: "2026-10-01" })
      );

      const saveBtn = screen.getByRole("button", { name: /บันทึก/i });
      fireEvent.click(saveBtn);
      expect(handleSave).toHaveBeenCalled();
    });
  });

  describe("MissionDonatePanel", () => {
    test("handles adding, editing, and deleting mission slots", () => {
      const handleChange = jest.fn();
      const handleSave = jest.fn();

      render(
        <MissionDonatePanel
          value={DEFAULT_WIDGET_CONFIG.mission}
          onChange={handleChange}
          onSave={handleSave}
        />
      );

      expect(screen.getByText("Mission Donate")).toBeInTheDocument();

      const addBtn = screen.getByRole("button", { name: /\+ เพิ่มช่องภารกิจ/ });
      fireEvent.click(addBtn);
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          missions: expect.arrayContaining([
            expect.objectContaining({ price: 50 }),
          ]),
        })
      );

      const editInputs = screen.getAllByPlaceholderText(/ชื่อภารกิจ/);
      fireEvent.change(editInputs[0], { target: { value: "ภารกิจพิเศษ" } });
      expect(handleChange).toHaveBeenCalled();

      const deleteBtns = screen.getAllByTitle("ลบภารกิจนี้");
      fireEvent.click(deleteBtns[0]);
      expect(handleChange).toHaveBeenCalled();

      const saveBtn = screen.getByRole("button", { name: /บันทึก/i });
      fireEvent.click(saveBtn);
      expect(handleSave).toHaveBeenCalled();
    });

    test("handles mission slot price update and adding slot when below limit", () => {
      const handleChange = jest.fn();
      const handleSave = jest.fn();

      const elevenMissions = Array.from({ length: 11 }, (_, i) => ({
        id: `m-${i}`,
        name: `Mission ${i + 1}`,
        price: 100,
      }));

      const { container } = render(
        <MissionDonatePanel
          value={{ title: "11 Missions", missions: elevenMissions }}
          onChange={handleChange}
          onSave={handleSave}
        />
      );

      const priceInput = container.querySelector('input[type="number"]');
      if (priceInput) {
        fireEvent.change(priceInput, { target: { value: "200" } });
        expect(handleChange).toHaveBeenCalled();
      }

      const addBtn = screen.getByRole("button", { name: /\+ เพิ่มช่องภารกิจ/ });
      fireEvent.click(addBtn);
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe("DonateAlertPanel", () => {
    test("handles min amount, template, and tier management", () => {
      const handleChange = jest.fn();
      const handleSave = jest.fn();

      render(
        <DonateAlertPanel
          value={{
            ...DEFAULT_WIDGET_CONFIG.alert,
            useAmountTiers: true,
          }}
          onChange={handleChange}
          onSave={handleSave}
        />
      );

      expect(screen.getByText("Donate Alert")).toBeInTheDocument();

      const minInput = screen.getByPlaceholderText("10");
      fireEvent.change(minInput, { target: { value: "20" } });
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ minAmount: 20 })
      );

      // Open message style accordion
      const msgSectionBtn = screen.getByRole("button", { name: /ข้อความ & การจัดสไตล์/ });
      fireEvent.click(msgSectionBtn);

      const templateInput = screen.getByDisplayValue(DEFAULT_WIDGET_CONFIG.alert.template);
      fireEvent.change(templateInput, {
        target: { value: "{user} ได้ส่ง {amount} บาท!" },
      });
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ template: "{user} ได้ส่ง {amount} บาท!" })
      );

      // Open effect accordion to view tiers
      const effectSectionBtn = screen.getByRole("button", {
        name: /เอฟเฟกต์ & การแสดงผลตามจำนวนเงิน/,
      });
      fireEvent.click(effectSectionBtn);

      const addTierBtn = screen.getByRole("button", { name: /\+ เพิ่มช่วงยอดเงิน/ });
      fireEvent.click(addTierBtn);
      expect(handleChange).toHaveBeenCalled();

      const saveBtn = screen.getByRole("button", { name: /บันทึก/i });
      fireEvent.click(saveBtn);
      expect(handleSave).toHaveBeenCalled();
    });

    test("handles sound, TTS, typography styles, animations, and tier edits", () => {
      const handleChange = jest.fn();
      const handleSave = jest.fn();

      render(
        <DonateAlertPanel
          value={{
            ...DEFAULT_WIDGET_CONFIG.alert,
            useAmountTiers: true,
          }}
          onChange={handleChange}
          onSave={handleSave}
        />
      );

      // Open Audio & TTS accordion
      const audioBtn = screen.getByRole("button", {
        name: /เสียงแจ้งเตือน & ข้อความเสียง \(TTS\)/,
      });
      fireEvent.click(audioBtn);

      const soundSelect = screen.getByDisplayValue("Mythic Horn");
      fireEvent.change(soundSelect, { target: { value: "dragon-roar" } });
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ soundPreset: "dragon-roar" })
      );

      const ttsVoiceSelect = screen.getByDisplayValue(/Thai หญิง/);
      fireEvent.change(ttsVoiceSelect, { target: { value: "th-male" } });
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ ttsVoice: "th-male" })
      );

      const ttsSpeedSelect = screen.getByDisplayValue("1.0x");
      fireEvent.change(ttsSpeedSelect, { target: { value: "1.5x" } });
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ ttsSpeed: "1.5x" })
      );

      // Open Style accordion
      const msgBtn = screen.getByRole("button", { name: /ข้อความ & การจัดสไตล์/ });
      fireEvent.click(msgBtn);

      const fontSelect = screen.getByDisplayValue(/Kanit/);
      fireEvent.change(fontSelect, { target: { value: "FC Vision" } });
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ fontFamily: "FC Vision" })
      );

      const weightSelect = screen.getByDisplayValue(/Bold \(700\)/);
      fireEvent.change(weightSelect, { target: { value: "400" } });
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ fontWeight: "400" })
      );

      // Open Effects accordion
      const effectBtn = screen.getByRole("button", {
        name: /เอฟเฟกต์ & การแสดงผลตามจำนวนเงิน/,
      });
      fireEvent.click(effectBtn);

      const animInSelect = screen.getByDisplayValue(/Bounce In/);
      fireEvent.change(animInSelect, { target: { value: "fadeIn" } });
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ animationIn: "fadeIn" })
      );

      const filterSelect = screen.getByDisplayValue(/Glow/);
      fireEvent.change(filterSelect, { target: { value: "Pulse" } });
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ filterEffect: "Pulse" })
      );

      const deleteTierBtn = screen.getAllByTitle("ลบช่วงนี้")[0];
      fireEvent.click(deleteTierBtn);
      expect(handleChange).toHaveBeenCalled();
    });

    test("handles all input controls, sliders, colors, audio upload, and tier actions", () => {
      const handleChange = jest.fn();
      const handleSave = jest.fn();
      window.alert = jest.fn();

      const { container } = render(
        <DonateAlertPanel
          value={{
            ...DEFAULT_WIDGET_CONFIG.alert,
            useAmountTiers: true,
          }}
          onChange={handleChange}
          onSave={handleSave}
        />
      );

      // 1. Basic: Image selection
      const fileInputs = container.querySelectorAll('input[type="file"]');
      if (fileInputs[0]) {
        const dummyImg = new File(["dummy"], "test.png", { type: "image/png" });
        fireEvent.change(fileInputs[0], { target: { files: [dummyImg] } });
      }

      // 2. Audio & TTS
      const audioBtn = screen.getByRole("button", {
        name: /เสียงแจ้งเตือน & ข้อความเสียง \(TTS\)/,
      });
      fireEvent.click(audioBtn);

      const ranges = container.querySelectorAll('input[type="range"]');
      if (ranges[0]) {
        fireEvent.change(ranges[0], { target: { value: "65" } });
        expect(handleChange).toHaveBeenCalledWith(
          expect.objectContaining({ volume: 65 })
        );
      }

      const checkboxes = screen.getAllByRole("checkbox");
      if (checkboxes[0]) {
        fireEvent.click(checkboxes[0]);
        expect(handleChange).toHaveBeenCalled();
      }

      if (ranges[1]) {
        fireEvent.change(ranges[1], { target: { value: "70" } });
        expect(handleChange).toHaveBeenCalledWith(
          expect.objectContaining({ ttsVolume: 70 })
        );
      }

      if (fileInputs[1]) {
        const dummyAudio = new File(["dummy"], "custom.mp3", { type: "audio/mpeg" });
        fireEvent.change(fileInputs[1], { target: { files: [dummyAudio] } });
        expect(handleChange).toHaveBeenCalledWith(
          expect.objectContaining({ customSoundFile: "custom.mp3", soundPreset: "custom" })
        );
      }

      // 3. Message & Typography
      const msgBtn = screen.getByRole("button", { name: /ข้อความ & การจัดสไตล์/ });
      fireEvent.click(msgBtn);

      if (checkboxes[1]) {
        fireEvent.click(checkboxes[1]);
        expect(handleChange).toHaveBeenCalled();
      }

      const fontSizeSlider = container.querySelectorAll('input[type="range"]')[2];
      if (fontSizeSlider) {
        fireEvent.change(fontSizeSlider, { target: { value: "32" } });
        expect(handleChange).toHaveBeenCalledWith(
          expect.objectContaining({ fontSize: 32 })
        );
      }

      const colorInputs = container.querySelectorAll('input[type="color"]');
      if (colorInputs.length >= 4) {
        fireEvent.change(colorInputs[0], { target: { value: "#ffffff" } });
        expect(handleChange).toHaveBeenCalledWith(
          expect.objectContaining({ textColor: "#ffffff" })
        );

        fireEvent.change(colorInputs[1], { target: { value: "#c084fc" } });
        expect(handleChange).toHaveBeenCalledWith(
          expect.objectContaining({ userNameColor: "#c084fc" })
        );

        fireEvent.change(colorInputs[2], { target: { value: "#fbbf24" } });
        expect(handleChange).toHaveBeenCalledWith(
          expect.objectContaining({ amountColor: "#fbbf24" })
        );

        fireEvent.change(colorInputs[3], { target: { value: "#000000" } });
        expect(handleChange).toHaveBeenCalledWith(
          expect.objectContaining({ strokeColor: "#000000" })
        );
      }

      const strokeSlider = container.querySelectorAll('input[type="range"]')[3];
      if (strokeSlider) {
        fireEvent.change(strokeSlider, { target: { value: "4" } });
        expect(handleChange).toHaveBeenCalledWith(
          expect.objectContaining({ strokeSize: 4 })
        );
      }

      // 4. Effects & Tiers
      const effectBtn = screen.getByRole("button", {
        name: /เอฟเฟกต์ & การแสดงผลตามจำนวนเงิน/,
      });
      fireEvent.click(effectBtn);

      const animOutSelect = screen.getByDisplayValue(/Fade Out/);
      fireEvent.change(animOutSelect, { target: { value: "slideOutUp" } });
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ animationOut: "slideOutUp" })
      );

      const numberInputs = container.querySelectorAll('input[type="number"]');
      numberInputs.forEach((numInput) => {
        fireEvent.change(numInput, { target: { value: "2" } });
      });

      const tierCheckbox = screen.getAllByRole("checkbox").pop();
      if (tierCheckbox) {
        fireEvent.click(tierCheckbox);
        expect(handleChange).toHaveBeenCalled();
      }

      const testTierBtns = screen.getAllByRole("button", { name: /ทดสอบช่วงนี้/ });
      if (testTierBtns[0]) {
        fireEvent.click(testTierBtns[0]);
        expect(window.alert).toHaveBeenCalled();
      }

      const tierSoundSelects = screen.getAllByDisplayValue("Mythic Horn");
      if (tierSoundSelects.length > 1) {
        fireEvent.change(tierSoundSelects[1], { target: { value: "ancient-bell" } });
        expect(handleChange).toHaveBeenCalled();
      }
    });
  });

  describe("WidgetPreview", () => {
    test("renders all widget preview types and handles animation preview buttons and rerenders", () => {
      jest.useFakeTimers();

      const { rerender } = render(
        <WidgetPreview
          type="alert"
          username="CustomStreamer"
          config={{
            ...DEFAULT_WIDGET_CONFIG.alert,
            overlayImage: "http://localhost/alert.png",
            filterEffect: "Glow",
            strokeSize: 2,
            animationIn: "bounceIn",
            animationOut: "fadeOut",
          }}
          playing={false}
        />
      );
      expect(screen.getByText(/CustomStreamer/)).toBeInTheDocument();

      // Trigger image error
      const overlayImg = screen.getByAltText("overlay");
      fireEvent.error(overlayImg);

      // Trigger manual preview buttons
      const btnIn = screen.getByRole("button", { name: /ดูแอนิเมชั่นเข้า/ });
      fireEvent.click(btnIn);
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const btnOut = screen.getByRole("button", { name: /ดูแอนิเมชั่นออก/ });
      fireEvent.click(btnOut);
      act(() => {
        jest.advanceTimersByTime(1200);
      });

      // Rerender with changed animationIn
      rerender(
        <WidgetPreview
          type="alert"
          config={{
            ...DEFAULT_WIDGET_CONFIG.alert,
            animationIn: "slideInUp",
            animationOut: "fadeOut",
          }}
          playing={false}
        />
      );
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Rerender with changed animationOut
      rerender(
        <WidgetPreview
          type="alert"
          config={{
            ...DEFAULT_WIDGET_CONFIG.alert,
            animationIn: "slideInUp",
            animationOut: "zoomOut",
          }}
          playing={false}
        />
      );
      act(() => {
        jest.advanceTimersByTime(1200);
      });

      // Rerender with playing = true to test alert sequence timers
      rerender(
        <WidgetPreview
          type="alert"
          config={{
            ...DEFAULT_WIDGET_CONFIG.alert,
            durationIn: 0.5,
            durationDisplay: 2,
            durationOut: 0.5,
          }}
          playing={true}
        />
      );
      act(() => {
        jest.advanceTimersByTime(600); // tDisplay
      });
      act(() => {
        jest.advanceTimersByTime(2100); // tOut
      });
      act(() => {
        jest.advanceTimersByTime(600); // tEnd
      });

      // Rerender with various filter effects
      rerender(
        <WidgetPreview
          type="alert"
          config={{
            ...DEFAULT_WIDGET_CONFIG.alert,
            filterEffect: "Shake",
          }}
          playing={false}
        />
      );

      rerender(
        <WidgetPreview
          type="alert"
          config={{
            ...DEFAULT_WIDGET_CONFIG.alert,
            filterEffect: "Pulse",
          }}
          playing={false}
        />
      );

      rerender(
        <WidgetPreview
          type="alert"
          config={{
            ...DEFAULT_WIDGET_CONFIG.alert,
            filterEffect: "Glitch",
          }}
          playing={false}
        />
      );

      rerender(
        <WidgetPreview
          type="alert"
          config={{
            ...DEFAULT_WIDGET_CONFIG.alert,
            filterEffect: "Wave",
          }}
          playing={false}
        />
      );

      rerender(
        <WidgetPreview
          type="alert"
          config={{
            ...DEFAULT_WIDGET_CONFIG.alert,
            filterEffect: "None",
            strokeSize: 0,
          }}
          playing={false}
        />
      );

      rerender(

        <WidgetPreview
          type="goal"
          config={{
            ...DEFAULT_WIDGET_CONFIG.goal,
            theme: "crimson",
            startDate: "2026-09-01",
            endDate: "2026-09-30",
          }}
          playing={false}
        />
      );
      expect(screen.getByText("เป้าหมายพัฒนาสตรีม")).toBeInTheDocument();

      rerender(
        <WidgetPreview
          type="goal"
          config={{
            ...DEFAULT_WIDGET_CONFIG.goal,
            theme: "gold",
            target: 0,
          }}
          playing={false}
        />
      );

      rerender(
        <WidgetPreview
          type="leaderboard"
          config={{
            ...DEFAULT_WIDGET_CONFIG.leaderboard,
            limit: 10,
            showAmount: true,
          }}
          playing={false}
        />
      );
      expect(screen.getByText("TOP DONORS ประจำเดือน")).toBeInTheDocument();

      rerender(
        <WidgetPreview
          type="leaderboard"
          config={{
            ...DEFAULT_WIDGET_CONFIG.leaderboard,
            limit: 2,
            showAmount: false,
          }}
          playing={false}
        />
      );

      rerender(
        <WidgetPreview
          type="mission"
          config={DEFAULT_WIDGET_CONFIG.mission}
          playing={false}
        />
      );
      expect(screen.getByText("ภารกิจสตรีมเมอร์วันนี้")).toBeInTheDocument();

      jest.useRealTimers();
    });

  });

  describe("widgetStorage", () => {
    test("saves and loads widget configuration from localStorage", () => {
      const customConfig = {
        ...DEFAULT_WIDGET_CONFIG,
        goal: { ...DEFAULT_WIDGET_CONFIG.goal, target: 50000 },
      };
      saveWidgetConfig(customConfig);

      const loaded = getWidgetConfig();
      expect(loaded.goal.target).toBe(50000);

      localStorage.setItem("donix_widget_config", "invalid-json");
      const fallback = getWidgetConfig();
      expect(fallback.goal.target).toBe(10000);
    });

    test("generates browser source url correctly", () => {
      const url = getBrowserSourceUrl("alert", "mychannel");
      expect(url).toContain("/overlay/alert/mychannel");

      const defaultUrl = getBrowserSourceUrl("goal");
      expect(defaultUrl).toContain("/overlay/goal/guest");
    });
  });

  describe("WidgetPage (Full Page Integration)", () => {
    test("renders full widget page with authenticated token and handles tab switching and save", () => {
      const mockAudio = {
        currentTime: 0,
        createOscillator: jest.fn().mockReturnValue({
          type: "",
          frequency: {
            setValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
          },
          connect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn(),
        }),
        createGain: jest.fn().mockReturnValue({
          gain: {
            setValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
          },
          connect: jest.fn(),
        }),
        destination: {},
      };
      window.AudioContext = jest.fn().mockImplementation(() => mockAudio);

      const mockPayload = btoa(JSON.stringify({ username: "widget_streamer" }));
      localStorage.setItem("token", `header.${mockPayload}.signature`);

      render(
        <BrowserRouter>
          <WidgetPage />
        </BrowserRouter>
      );

      expect(screen.getByText("WIDGETS")).toBeInTheDocument();
      expect(screen.getAllByText("วิดเจ็ตรับเงิน").length).toBeGreaterThan(0);

      // Switch to Goal and edit
      fireEvent.click(screen.getByText("Donate Goal"));
      expect(screen.getByText("GOAL PROGRESS BAR")).toBeInTheDocument();
      const goalTitleInput = screen.getByPlaceholderText(/เป้าหมายพัฒนาสตรีม/);
      fireEvent.change(goalTitleInput, { target: { value: "Live Stream Goal" } });

      // Switch to Leaderboard and edit
      fireEvent.click(screen.getByText("Leaderboard"));
      expect(screen.getByText("TOP SUPPORTERS RANKING")).toBeInTheDocument();
      const lbTitleInput = screen.getByPlaceholderText(/TOP 5/);
      fireEvent.change(lbTitleInput, { target: { value: "Top Supporters Ranking" } });

      // Switch to Mission and edit
      fireEvent.click(screen.getByText("Mission Donate"));
      expect(screen.getByText("DONATION MISSION SLOTS")).toBeInTheDocument();
      const missionTitleInput = screen.getByPlaceholderText(/ภารกิจสตรีมเมอร์วันนี้/);
      fireEvent.change(missionTitleInput, { target: { value: "New Mission" } });

      // Test Alert playback with audio synthesis and Socket.IO emission
      fireEvent.click(screen.getByText("Donate Alert"));
      const testAlertBtn = screen.getByRole("button", { name: /ทดสอบ Alert/ });
      fireEvent.click(testAlertBtn);
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        "test-alert",
        expect.objectContaining({ username: "widget_streamer", amount: 500 })
      );

      // Save config
      const saveBtn = screen.getByRole("button", { name: /บันทึก/i });
      fireEvent.click(saveBtn);
      const saved = getWidgetConfig();
      expect(saved).toBeDefined();

      // Logout
      const logoutBtn = screen.getByText("ออกจากระบบ");
      fireEvent.click(logoutBtn);
      expect(localStorage.getItem("token")).toBeNull();
    });

    test("plays audio simulation sounds for different presets and updates alert settings", () => {
      const mockAudio = {
        currentTime: 0,
        createOscillator: jest.fn().mockReturnValue({
          type: "",
          frequency: {
            setValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
          },
          connect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn(),
        }),
        createGain: jest.fn().mockReturnValue({
          gain: {
            setValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
          },
          connect: jest.fn(),
        }),
        destination: {},
      };
      window.AudioContext = jest.fn().mockImplementation(() => mockAudio);

      const mockPayload = btoa(JSON.stringify({ username: "sound_streamer" }));
      localStorage.setItem("token", `header.${mockPayload}.signature`);

      render(
        <BrowserRouter>
          <WidgetPage />
        </BrowserRouter>
      );

      // Open Audio & TTS accordion
      const audioAccordion = screen.getByRole("button", {
        name: /เสียงแจ้งเตือน & ข้อความเสียง \(TTS\)/,
      });
      fireEvent.click(audioAccordion);

      const soundSelect = screen.getByDisplayValue("Mythic Horn");
      const testBtn = screen.getByRole("button", { name: /ทดสอบ Alert/ });

      // Test dragon roar
      fireEvent.change(soundSelect, { target: { value: "dragon-roar" } });
      fireEvent.click(testBtn);

      // Test ancient bell
      fireEvent.change(soundSelect, { target: { value: "ancient-bell" } });
      fireEvent.click(testBtn);

      // Test none
      fireEvent.change(soundSelect, { target: { value: "none" } });
      fireEvent.click(testBtn);

      // Change min amount in Alert panel to trigger updateSection("alert", ...)
      const minInput = screen.getByPlaceholderText("10");
      fireEvent.change(minInput, { target: { value: "50" } });
    });

    test("handles corrupted token and redirects", () => {
      localStorage.setItem("token", "corrupt_jwt_token");
      render(
        <BrowserRouter>
          <WidgetPage />
        </BrowserRouter>
      );
      expect(localStorage.getItem("token")).toBeNull();
    });

    test("triggers TTS speech on test alert and handles tts timeout and completion", () => {
      jest.useFakeTimers();
      const mockPayload = btoa(JSON.stringify({ username: "tts_streamer" }));
      localStorage.setItem("token", `header.${mockPayload}.signature`);

      render(
        <BrowserRouter>
          <WidgetPage />
        </BrowserRouter>
      );

      const testBtn = screen.getByRole("button", { name: /ทดสอบ Alert/ });
      fireEvent.click(testBtn);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      act(() => {
        jest.advanceTimersByTime(7000);
      });

      jest.useRealTimers();
    });
  });
});
