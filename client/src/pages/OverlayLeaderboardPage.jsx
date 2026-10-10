import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  const processedDonationIdsRef = useRef(new Set());

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

  // ดึงการตั้งค่าและอันดับผู้สนับสนุนจาก API (ฟังก์ชันซิงค์ข้อมูลจริงจาก DB)
  const fetchLeaderboardConfig = useCallback(async () => {
    if (!token) return;
    try {
      const safeToken = encodeURIComponent(String(token).trim());
      const response = await fetch(
        `${API_URL}/public/overlay/leaderboard/${safeToken}`
      );
      if (!response.ok) return;

      const result = await response.json();
      if (result?.data?.leaderboard) {
        setConfig((prev) => ({ ...prev, ...result.data.leaderboard }));
        if (Array.isArray(result.data.leaderboard.donors)) {
          setDonors(result.data.leaderboard.donors);
        }
        if (result.data.token) joinStreamRoom(result.data.token);
        if (result.data.streamer?.id) joinStreamRoom(result.data.streamer.id);
        if (result.data.streamer?.username) joinStreamRoom(result.data.streamer.username);
      }
    } catch {
      // ใช้แคชเดิมต่อไปหากเชื่อมต่อ API ไม่ได้
    }
  }, [token]);

  useEffect(() => {
    void fetchLeaderboardConfig();

    // Auto-sync จาก DB เป็นระยะ (ทุก 30 วินาที) เพื่อการันตีอันดับและยอดเงินตรงกับระบบ 100%
    const interval = setInterval(() => {
      void fetchLeaderboardConfig();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchLeaderboardConfig]);

  // ประมวลผลเมื่อมีโดเนทใหม่เข้ามาในระบบ
  const handleDonationReceived = useCallback(
    (alertData) => {
      const donationId = alertData?.id || alertData?._id;
      if (donationId) {
        const idStr = String(donationId);
        if (processedDonationIdsRef.current.has(idStr)) {
          return;
        }
        processedDonationIdsRef.current.add(idStr);
      }

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

      window.setTimeout(() => {
        void fetchLeaderboardConfig();
      }, 800);

      return () => window.clearTimeout(timer);
    },
    [config?.limit, fetchLeaderboardConfig]
  );

  // เชื่อมต่อ Socket.IO ฟัง Event "donation-alert"
  useEffect(() => {
    const streamRoom = token ? String(token).trim() : "guest";
    const socket = getSocket();

    joinStreamRoom(streamRoom);

    const handleDonation = (data) => {
      if (!data || data.isTest) return;
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
      className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-transparent p-6 select-none font-sans antialiased"
    >
      <div
        data-testid="leaderboard-display-card"
        className="w-full max-w-xl rounded-3xl border border-white/15 bg-[#0c0a18]/95 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl transition-all"
        style={{
          boxShadow: "0 0 50px rgba(124, 58, 237, 0.4)",
        }}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Trophy size={26} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                {config.title || "TOP SUPPORTERS"}
              </h1>
              <p className="text-xs sm:text-sm text-purple-300 font-semibold mt-0.5">
                อันดับสูงสุด {limit} ท่าน
              </p>
            </div>
          </div>

          {lastUpdatedDonor && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 animate-pulse bg-amber-400/15 border border-amber-400/30 px-3 py-1 rounded-full shadow-xs">
              <Sparkles size={13} /> อัปเดตล่าสุด
            </span>
          )}
        </div>

        {/* Donors List */}
        <div className="space-y-2.5">
          {displayedDonors.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-white/10 bg-[#120e24]/60 space-y-2">
              <Trophy size={36} className="text-gray-500/50 mb-1" />
              <p className="text-base font-bold text-gray-300">
                ยังไม่มีผู้สนับสนุนในรอบนี้
              </p>
              <p className="text-xs text-gray-400">
                เมื่อมียอดโดเนทเข้ามา รายชื่อจะปรากฏที่นี่แบบเรียลไทม์
              </p>
            </div>
          ) : (
            displayedDonors.map((donor, index) => {
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              const isRecent = donor.name === lastUpdatedDonor;
              const amountVal = Number(donor.amount || donor.totalAmount) || 0;

              let cardStyle = "border-[#2b2346] bg-[#141026] text-gray-200";
              if (isFirst) {
                cardStyle =
                  "border-amber-500/50 bg-amber-950/35 text-white shadow-[0_0_20px_rgba(234,179,8,0.25)] ring-1 ring-amber-400/30";
              } else if (isSecond) {
                cardStyle = "border-gray-400/50 bg-gray-800/35 text-white shadow-sm";
              } else if (isThird) {
                cardStyle = "border-amber-700/50 bg-amber-950/25 text-white shadow-sm";
              }

              return (
                <div
                  key={`${donor.name}-${index}`}
                  className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 ${cardStyle} ${
                    isRecent ? "ring-2 ring-purple-400 scale-[1.02]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Rank Icon or Number */}
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                      {isFirst ? (
                        <Crown size={22} className="text-amber-400 animate-bounce" />
                      ) : isSecond ? (
                        <Medal size={22} className="text-gray-300" />
                      ) : isThird ? (
                        <Medal size={22} className="text-amber-600" />
                      ) : (
                        <span className="font-black text-sm text-gray-400">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Donor Name */}
                    <span className="truncate font-bold text-base sm:text-lg text-white tracking-wide">
                      {donor.name}
                    </span>
                  </div>

                  {/* Amount */}
                  {config.showAmount !== false && (
                    <span className="font-black text-amber-300 font-mono text-base sm:text-lg ml-3 shrink-0">
                      {amountVal.toLocaleString()} ฿
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default OverlayLeaderboardPage;
