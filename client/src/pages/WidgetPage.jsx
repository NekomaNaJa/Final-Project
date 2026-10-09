import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import WidgetHeader from "../components/Widget/WidgetHeader";
import WidgetTypeTabs from "../components/Widget/WidgetTypeTabs";
import DonateAlertPanel from "../components/Widget/DonateAlertPanel";
import DonateGoalPanel from "../components/Widget/DonateGoalPanel";
import LeaderboardPanel from "../components/Widget/LeaderboardPanel";
import MissionDonatePanel from "../components/Widget/MissionDonatePanel";
import WidgetPreview from "../components/Widget/WidgetPreview";
import BrowserSourceCard from "../components/Widget/BrowserSourceCard";
import {
  DEFAULT_WIDGET_CONFIG,
  getWidgetConfig,
  saveWidgetConfig,
} from "../components/Widget/widgetStorage";
import { fetchWidgetConfig, saveWidgetSettings } from "../utils/api";
import { playAlertSound, speakAlertText } from "../utils/alertAudio";
import { emitTestAlert } from "../utils/socket";

const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    localStorage.removeItem("token");
    return null;
  }
};

const WidgetPage = () => {
  const navigate = useNavigate();
  const user = getUserFromToken();
  const [activeTab, setActiveTab] = useState("alert");
  const [config, setConfig] = useState(getWidgetConfig);
  const [savedConfig, setSavedConfig] = useState(getWidgetConfig);
  const [widgetToken, setWidgetToken] = useState("");
  const [playing, setPlaying] = useState(false);

  // ดึงการตั้งค่าวิดเจ็ตจาก DB ผ่าน API เมื่อโหลดหน้าเว็บ
  useEffect(() => {
    let isMounted = true;
    const loadConfig = async () => {
      try {
        const data = await fetchWidgetConfig();
        if (isMounted && data) {
          if (data.token) {
            setWidgetToken(data.token);
          }
          const merged = {
            alert: { ...DEFAULT_WIDGET_CONFIG.alert, ...data.alert },
            goal: { ...DEFAULT_WIDGET_CONFIG.goal, ...data.goal },
            leaderboard: {
              ...DEFAULT_WIDGET_CONFIG.leaderboard,
              ...data.leaderboard,
            },
            mission: { ...DEFAULT_WIDGET_CONFIG.mission, ...data.mission },
          };
          setConfig(merged);
          setSavedConfig(merged);
          saveWidgetConfig(merged);
        }
      } catch {
        // หากเชื่อมต่อ API ไม่ได้ ให้ใช้ข้อมูลจาก localStorage ต่อไป
      }
    };

    void loadConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const updateSection = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      const result = await saveWidgetSettings(config);
      if (result?.token) {
        setWidgetToken(result.token);
      }
      saveWidgetConfig(config);
      setSavedConfig(config);
    } catch {
      // Fallback บันทึกลง localStorage หากเกิดข้อผิดพลาด
      saveWidgetConfig(config);
      setSavedConfig(config);
    }
  };

  const handleTest = () => {
    setPlaying(true);
    const donorName = user?.nickname || user?.username || "สตรีมเมอร์";
    if (activeTab === "alert") {
      // ส่ง Real-time Test Alert ไปยัง OBS Studio Browser Source
      if (user?.username) {
        emitTestAlert({
          username: user.username,
          streamerId: user._id || user.id,
          donorName,
          amount: 500,
          message: "ขอเพลงโปรดหน่อยครับ เล่นเกมเก่งมาก!",
        });
      }

      playAlertSound({
        preset: config.alert?.soundPreset,
        volume: config.alert?.volume,
        customSoundFile: config.alert?.customSoundFile,
      });

      if (config.alert?.ttsEnabled) {
        const rawTpl = config.alert?.template || "{user} โดเนท {amount} บาท";
        const parsedHeadline = rawTpl
          .replaceAll("{user}", donorName)
          .replaceAll("{amount}", "500");
        const donorMsg = " ขอเพลงโปรดหน่อยครับ เล่นเกมเก่งมาก!";

        window.setTimeout(() => {
          void speakAlertText({
            text: `${parsedHeadline}${donorMsg}`,
            voice: config.alert?.ttsVoice,
            volume: config.alert?.ttsVolume,
            speed: config.alert?.ttsSpeed,
          });
        }, 400);

      }
    }
    const durIn = Number(config.alert?.durationIn) || 0.8;
    const durDisplay = Number(config.alert?.durationDisplay) || 5;
    const durOut = Number(config.alert?.durationOut) || 0.8;
    const totalDuration = (durIn + durDisplay + durOut) * 1000;
    window.setTimeout(() => setPlaying(false), totalDuration);
  };

  const isLive =
    JSON.stringify(config[activeTab]) === JSON.stringify(savedConfig[activeTab]);

  return (
    <div className="relative min-h-screen bg-[#090812] font-sans text-white lg:flex">
      {/* Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[650px] w-[950px] -translate-x-1/2 rounded-full blur-[110px] opacity-75"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(124, 58, 237, 0.28) 0%, rgba(88, 28, 135, 0.15) 45%, rgba(9, 8, 18, 0) 75%)",
          }}
        />
        <div
          className="absolute top-1/4 -left-24 h-[500px] w-[500px] rounded-full blur-[120px] opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(109, 40, 217, 0.2) 0%, rgba(9, 8, 18, 0) 70%)",
          }}
        />
        <div
          className="absolute top-2/3 -right-24 h-[550px] w-[550px] rounded-full blur-[130px] opacity-35"
          style={{
            background:
              "radial-gradient(circle, rgba(147, 51, 234, 0.18) 0%, rgba(9, 8, 18, 0) 70%)",
          }}
        />
      </div>

      {/* Sticky Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col">
        <Topbar username={user?.username} breadcrumb="วิดเจ็ตรับเงิน" />

        <main className="mx-auto w-full max-w-[1200px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <WidgetHeader />
          <WidgetTypeTabs activeId={activeTab} onChange={setActiveTab} />

          {/* 2-Column Grid Layout */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            {/* Left Column: Form Settings */}
            <div>
              {activeTab === "alert" && (
                <DonateAlertPanel
                  value={config.alert}
                  onChange={(value) => updateSection("alert", value)}
                  onSave={handleSave}
                />
              )}
              {activeTab === "goal" && (
                <DonateGoalPanel
                  value={config.goal}
                  onChange={(value) => updateSection("goal", value)}
                  onSave={handleSave}
                />
              )}
              {activeTab === "leaderboard" && (
                <LeaderboardPanel
                  value={config.leaderboard}
                  onChange={(value) => updateSection("leaderboard", value)}
                  onSave={handleSave}
                />
              )}
              {activeTab === "mission" && (
                <MissionDonatePanel
                  value={config.mission}
                  onChange={(value) => updateSection("mission", value)}
                  onSave={handleSave}
                />
              )}
            </div>

            {/* Right Column: Real-time Preview & Browser Source Card */}
            <div className="space-y-4 lg:sticky lg:top-24 self-start">
              <WidgetPreview
                type={activeTab}
                config={config[activeTab]}
                playing={playing}
                username={user?.nickname || user?.username}
              />
              <BrowserSourceCard
                type={activeTab}
                username={user?.username}
                token={widgetToken}
                isLive={isLive}
                onTest={handleTest}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default WidgetPage;
