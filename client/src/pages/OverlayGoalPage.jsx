import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Target, Sparkles } from "lucide-react";
import {
  DEFAULT_WIDGET_CONFIG,
  GOAL_THEMES,
  getWidgetConfig,
} from "../components/Widget/widgetStorage";
import { API_URL } from "../utils/api";
import { getSocket, joinStreamRoom, leaveStreamRoom } from "../utils/socket";

const OverlayGoalPage = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const isDemoMode =
    searchParams.get("demo") === "1" || searchParams.get("test") === "1";

  const [config, setConfig] = useState(() => {
    try {
      return getWidgetConfig().goal;
    } catch {
      return DEFAULT_WIDGET_CONFIG.goal;
    }
  });

  const [currentAmount, setCurrentAmount] = useState(() => {
    return Number(config?.current) || 0;
  });

  const [recentGain, setRecentGain] = useState(null);

  // ตั้งค่าพื้นหลังโปร่งใสสำหรับ OBS Studio Browser Source
  useEffect(() => {
    const originalBodyBg = document.body.style.backgroundColor;
    const originalHtmlBg = document.documentElement.style.backgroundColor;

    document.body.style.backgroundColor = "transparent";
    document.documentElement.style.backgroundColor = "transparent";

    return () => {
      document.body.style.backgroundColor = originalBodyBg;
      document.documentElement.style.backgroundColor = originalHtmlBg;
    };
  }, []);

  // ดึงการตั้งค่าจาก API ด้วย token
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const fetchGoalConfig = async () => {
      try {
        const safeToken = encodeURIComponent(String(token).trim());
        const response = await fetch(
          `${API_URL}/public/overlay/goal/${safeToken}`
        );
        if (!response.ok) return;

        const result = await response.json();
        if (isMounted && result?.data?.goal) {
          setConfig((prev) => ({ ...prev, ...result.data.goal }));
          if (typeof result.data.goal.current === "number") {
            setCurrentAmount(result.data.goal.current);
          }
          if (result.data.token) {
            joinStreamRoom(result.data.token);
          }
          if (result.data.streamer?.id) {
            joinStreamRoom(result.data.streamer.id);
          }
          if (result.data.streamer?.username) {
            joinStreamRoom(result.data.streamer.username);
          }
        }
      } catch {
        // ใช้ค่าเริ่มต้นหรือแคชที่มีต่อไปหากเรียกเซิร์ฟเวอร์ไม่ได้
      }
    };

    void fetchGoalConfig();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // ประมวลผลเมื่อมียอดโดเนทใหม่เข้ามา
  const handleDonationReceived = useCallback((donation) => {
    const added = Number(donation?.amount) || 0;
    if (added <= 0) return;

    setCurrentAmount((prev) => prev + added);
    setRecentGain(added);

    const timer = window.setTimeout(() => {
      setRecentGain(null);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, []);

  // เชื่อมต่อ Socket.IO ฟัง Event "donation-alert"
  useEffect(() => {
    const streamRoom = token ? String(token).trim() : "guest";
    const socket = getSocket();

    joinStreamRoom(streamRoom);

    const handleDonation = (data) => {
      if (!data) return;
      handleDonationReceived(data);
    };

    const handleConfigUpdate = (data) => {
      if (!data) return;
      if (data.goal) {
        setConfig((prev) => ({ ...prev, ...data.goal }));
        if (typeof data.goal.current === "number") {
          setCurrentAmount(data.goal.current);
        }
      }
    };

    socket.on("donation-alert", handleDonation);
    socket.on("widget-config-updated", handleConfigUpdate);

    return () => {
      socket.off("donation-alert", handleDonation);
      socket.off("widget-config-updated", handleConfigUpdate);
      leaveStreamRoom(streamRoom);
    };
  }, [token, handleDonationReceived]);

  // แสดงตัวอย่างการแจ้งเตือนยอดเงินเมื่อเปิดในโหมด demo
  useEffect(() => {
    if (isDemoMode) {
      handleDonationReceived({ amount: 500 });
    }
  }, [isDemoMode, handleDonationReceived]);

  const target = Math.max(1, Number(config?.target) || 10000);
  const percent = Math.min(100, Math.round((currentAmount / target) * 100));
  const themeObj = useMemo(() => {
    return GOAL_THEMES.find((t) => t.id === config?.theme) || GOAL_THEMES[0];
  }, [config?.theme]);

  return (
    <div
      data-testid="overlay-goal-container"
      className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-transparent p-6 select-none"
    >
      <div
        data-testid="goal-display-card"
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0c0a18]/90 p-6 shadow-2xl backdrop-blur-xl transition-all"
        style={{
          boxShadow: `0 0 35px ${themeObj.glow}`,
        }}
      >
        {/* Header: Title and Percent Badge */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10"
              style={{ color: themeObj.color }}
            >
              <Target size={22} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-wide">
                {config.title || "เป้าหมายโดเนท"}
              </h1>
              {recentGain && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 animate-pulse">
                  <Sparkles size={12} />
                  +{recentGain.toLocaleString()} ฿ เพิ่งเข้ามา!
                </span>
              )}
            </div>
          </div>

          <span
            className="text-sm font-black px-3.5 py-1 rounded-full bg-[#16102c] border shadow-xs"
            style={{ borderColor: themeObj.color, color: themeObj.color }}
          >
            {percent}%
          </span>
        </div>

        {/* Glowing Progress Bar */}
        <div className="h-7 w-full overflow-hidden rounded-full bg-[#130d24] border border-[#2e2648] p-1 shadow-inner">
          <div
            className={`h-full rounded-full bg-linear-to-r ${themeObj.gradient} transition-all duration-700 ease-out shadow-[0_0_20px_var(--glow)]`}
            style={{
              width: `${percent}%`,
              "--glow": themeObj.glow,
            }}
          />
        </div>

        {/* Stats: Current Amount & Date Range */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-extrabold font-mono text-white text-base">
            <span style={{ color: themeObj.color }}>
              {currentAmount.toLocaleString()}
            </span>{" "}
            / {target.toLocaleString()} บาท
          </span>

          {config.startDate && config.endDate && (
            <span className="text-xs text-gray-400 font-medium">
              {config.startDate} ถึง {config.endDate}
            </span>
          )}
        </div>
      </div>

      {/* Floating Preview Controls (สำหรับทดสอบในเบราว์เซอร์หรือ OBS) */}
      <footer
        data-testid="overlay-test-controls"
        className="pointer-events-auto fixed bottom-4 right-4 flex items-center gap-2 rounded-xl border border-white/10 bg-[#120f24]/85 p-2 text-xs text-white shadow-xl backdrop-blur-md opacity-40 hover:opacity-100 transition-opacity"
      >
        <span className="text-[11px] text-purple-300">OBS Goal</span>
        <button
          type="button"
          onClick={() => handleDonationReceived({ amount: 100 })}
          className="rounded-lg bg-purple-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-purple-500 cursor-pointer active:scale-95 transition-all shadow-sm"
        >
          +100 ฿
        </button>
        <button
          type="button"
          onClick={() => handleDonationReceived({ amount: 500 })}
          className="rounded-lg bg-pink-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-pink-500 cursor-pointer active:scale-95 transition-all shadow-sm"
        >
          +500 ฿
        </button>
        <button
          type="button"
          onClick={() => setCurrentAmount(0)}
          className="rounded-lg bg-[#2e2648] px-2 py-1 text-[11px] font-semibold text-gray-300 hover:bg-[#3b325c] cursor-pointer"
        >
          รีเซ็ต
        </button>
      </footer>
    </div>
  );
};

export default OverlayGoalPage;
