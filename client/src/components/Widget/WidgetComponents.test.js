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

describe("Widget Components & Functions", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
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

      const fileInput = container.querySelector('input[type="file"]');
      const badFile = new File(["dummy"], "sound.wav", { type: "audio/wav" });
      fireEvent.change(fileInput, { target: { files: [badFile] } });
      expect(window.alert).toHaveBeenCalledWith("รองรับเฉพาะไฟล์เสียงประเภท MP3 เท่านั้น");

      const goodFile = new File(["dummy"], "custom.mp3", { type: "audio/mpeg" });
      fireEvent.change(fileInput, { target: { files: [goodFile] } });
      expect(handleSelect).toHaveBeenCalledWith("custom.mp3");

      const buttons = container.querySelectorAll("button");
      if (buttons[1]) {
        fireEvent.click(buttons[1]);
        expect(handleSelect).toHaveBeenCalledWith("");
      }
    });
  });

  describe("BrowserSourceCard", () => {
    test("renders URL and copies to clipboard", async () => {
      const mockClipboard = { writeText: jest.fn().mockResolvedValue() };
      Object.assign(navigator, { clipboard: mockClipboard });

      const handleTest = jest.fn();
      render(
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
      fireEvent.change(fontSelect, { target: { value: "Cinzel" } });
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ fontFamily: "Cinzel" })
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
  });

  describe("WidgetPreview", () => {
    test("renders all widget preview types without throwing", () => {
      const { rerender } = render(
        <WidgetPreview
          type="alert"
          config={{
            ...DEFAULT_WIDGET_CONFIG.alert,
            overlayImage: "http://localhost/alert.png",
            filterEffect: "Glow",
            strokeSize: 2,
          }}
          playing={true}
        />
      );
      expect(screen.getByText(/Shadow King/)).toBeInTheDocument();

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

      // Test Alert playback with audio synthesis
      fireEvent.click(screen.getByText("Donate Alert"));
      const testAlertBtn = screen.getByRole("button", { name: /ทดสอบ Alert/ });
      fireEvent.click(testAlertBtn);

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

    test("handles corrupted token and redirects", () => {
      localStorage.setItem("token", "corrupt_jwt_token");
      render(
        <BrowserRouter>
          <WidgetPage />
        </BrowserRouter>
      );
      expect(localStorage.getItem("token")).toBeNull();
    });
  });
});
