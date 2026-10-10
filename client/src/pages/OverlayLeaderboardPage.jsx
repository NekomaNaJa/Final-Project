import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Trophy, Crown, Medal, Sparkles } from "lucide-react";
import {
  DEFAULT_WIDGET_CONFIG,
  getWidgetConfig,
} from "../components/Widget/widgetStorage";
import { API_URL } from "../utils/api";
import { getSocket, joinStreamRoom, leaveStreamRoom } from "../utils/socket";

const DEFAULT_SAMPLE_DONORS = [
  { name: "Shadow King", amount: 5000, totalAmount: 5000 },
  { name: "Luna Streamer", amount: 3200, totalAmount: 3200 },
  { name: "PixelKnight", amount: 1850, totalAmount: 1850 },
  { name: "Mocha", amount: 1200, totalAmount: 1200 },
  { name: "Aria Valkyrie", amount: 800, totalAmount: 800 },
];

const OverlayLeaderboardPage = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const isDemoMode =
    searchParams.get("demo") === "1" || searchParams.get("test") === "1";

  const [config, setConfig] = useState(() => {
    try {
      return getWidgetConfig().leaderboard;
    } catch {
      return DEFAULT_WIDGET_CONFIG.leaderboard;
    }
  });

  const [donors, setDonors] = useState(DEFAULT_SAMPLE_DONORS);
  const [lastUpdatedDonor, setLastUpdatedDonor] = useState(null);

  // ตั้งค่าพื้นหลังโปร่งใสสำหรับ OBS Browser Source
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

  // ดึงการตั้งค่าและอันดับผู้สนับสนุนจาก API
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const fetchLeaderboardConfig = async () => {
      try {
        const safeToken = encodeURIComponent(String(token).trim());
        const response = await fetch(
          `${API_URL}/public/overlay/leaderboard/${safeToken}`
        );
        if (!response.ok) return;

        const result = await response.json();
        if (isMounted && result?.data?.leaderboard) {
          setConfig((prev) => ({ ...prev, ...result.data.leaderboard }));
          if (Array.isArray(result.data.leaderboard.donors)) {
            setDonors(result.data.leaderboard.donors);
          }
        }
      } catch {
        // ใช้แคชเดิมต่อไปหากเชื่อมต่อ API ไม่ได้
      }
    };

    void fetchLeaderboardConfig();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // ประมวลผลเมื่อมีโดเนทใหม่เข้ามาในระบบ
  const handleDonationReceived = useCallback(
    (alertData) => {
      const donorName = alertData?.donorName || "ผู้สนับสนุนใจดี";
      const amount = Number(alertData?.amount) || 0;
      if (amount <= 0) return;

      setDonors((prev) => {
        const limit = Math.max(1, Math.min(20, Number(config?.limit) || 5));
        const existingIndex = prev.findIndex((d) => d.name === donorName);

        let nextList;
        if (existingIndex >= 0) {
          const currentTotal =
            Number(prev[existingIndex].amount || prev[existingIndex].totalAmount) || 0;
          const updated = {
            ...prev[existingIndex],
            amount: currentTotal + amount,
            totalAmount: currentTotal + amount,
          };
          nextList = [
            ...prev.slice(0, existingIndex),
            updated,
            ...prev.slice(existingIndex + 1),
          ];
        } else {
          nextList = [
            ...prev,
            { name: donorName, amount, totalAmount: amount },
          ];
        }

        nextList.sort((a, b) => (b.totalAmount || b.amount) - (a.totalAmount || a.amount));
        return nextList.slice(0, limit);
      });

      setLastUpdatedDonor(donorName);
      const timer = window.setTimeout(() => setLastUpdatedDonor(null), 4000);
      return () => window.clearTimeout(timer);
    },
    [config?.limit]
  );

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
      if (data.leaderboard) {
        setConfig((prev) => ({ ...prev, ...data.leaderboard }));
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

  // แสดงตัวอย่างการอัปเดตอันดับเมื่อเปิดในโหมด demo
  useEffect(() => {
    if (isDemoMode) {
      handleDonationReceived({
        donorName: "ผู้สนับสนุน VIP (Demo)",
        amount: 2500,
      });
    }
  }, [isDemoMode, handleDonationReceived]);

  const limit = Math.max(1, Math.min(20, Number(config?.limit) || 5));
  const displayedDonors = useMemo(() => {
    return donors.slice(0, limit);
  }, [donors, limit]);

  return (
    <div
      data-testid="overlay-leaderboard-container"
      className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-transparent p-6 select-none"
    >
      <div
        data-testid="leaderboard-display-card"
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c0a18]/90 p-5 shadow-2xl backdrop-blur-xl transition-all"
        style={{
          boxShadow: "0 0 40px rgba(124, 58, 237, 0.35)",
        }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Trophy size={20} />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-wide">
                {config.title || "TOP SUPPORTERS"}
              </h1>
              <p className="text-[10px] text-purple-300 font-semibold">
                อันดับสูงสุด {limit} ท่าน
              </p>
            </div>
          </div>

          {lastUpdatedDonor && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 animate-pulse bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
              <Sparkles size={11} /> อัปเดตล่าสุด
            </span>
          )}
        </div>

        {/* Donors List */}
        <div className="space-y-2">
          {displayedDonors.map((donor, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;
            const isRecent = donor.name === lastUpdatedDonor;
            const amountVal = Number(donor.amount || donor.totalAmount) || 0;

            let cardStyle = "border-[#251e3d] bg-[#141026] text-gray-300";
            if (isFirst) {
              cardStyle =
                "border-amber-500/40 bg-amber-950/25 text-white shadow-[0_0_16px_rgba(234,179,8,0.2)]";
            } else if (isSecond) {
              cardStyle = "border-gray-400/40 bg-gray-800/25 text-white";
            } else if (isThird) {
              cardStyle = "border-amber-700/40 bg-amber-950/15 text-white";
            }

            return (
              <div
                key={`${donor.name}-${index}`}
                className={`flex items-center justify-between p-2.5 rounded-2xl border text-xs transition-all duration-300 ${cardStyle} ${
                  isRecent ? "ring-2 ring-purple-400 scale-[1.02]" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Icon or Number */}
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                    {isFirst ? (
                      <Crown size={18} className="text-amber-400 animate-bounce" />
                    ) : isSecond ? (
                      <Medal size={18} className="text-gray-300" />
                    ) : isThird ? (
                      <Medal size={18} className="text-amber-600" />
                    ) : (
                      <span className="font-extrabold text-[12px] text-gray-500">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Donor Name */}
                  <span className="truncate font-bold text-sm text-white">
                    {donor.name}
                  </span>
                </div>

                {/* Amount */}
                {config.showAmount !== false && (
                  <span className="font-extrabold text-amber-300 font-mono text-xs ml-2 shrink-0">
                    {amountVal.toLocaleString()} ฿
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Preview Controls */}
      <footer
        data-testid="overlay-test-controls"
        className="pointer-events-auto fixed bottom-4 right-4 flex items-center gap-2 rounded-xl border border-white/10 bg-[#120f24]/85 p-2 text-xs text-white shadow-xl backdrop-blur-md opacity-40 hover:opacity-100 transition-opacity"
      >
        <span className="text-[11px] text-purple-300">OBS Leaderboard</span>
        <button
          type="button"
          onClick={() =>
            handleDonationReceived({
              donorName: "ผู้สนับสนุน VIP",
              amount: 1000,
            })
          }
          className="rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-500 cursor-pointer active:scale-95 transition-all shadow-sm"
        >
          ทดสอบ +1,000 ฿
        </button>
      </footer>
    </div>
  );
};

export default OverlayLeaderboardPage;
