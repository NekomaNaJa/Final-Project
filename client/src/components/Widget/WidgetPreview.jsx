import React from "react";
import { Bell, Trophy, Target, Sparkles, Crown, Medal, Flag } from "lucide-react";
import { GOAL_THEMES } from "./widgetStorage";

const SAMPLE_DONORS = [
  { name: "Shadow King", amount: 5000, avatar: "👑" },
  { name: "Luna Streamer", amount: 3200, avatar: "🌙" },
  { name: "PixelKnight", amount: 1850, avatar: "⚔️" },
  { name: "Mocha", amount: 1200, avatar: "☕" },
  { name: "Aria Valkyrie", amount: 800, avatar: "✨" },
  { name: "NeonRider", amount: 650, avatar: "⚡" },
  { name: "CyberSamurai", amount: 500, avatar: "🗡️" },
  { name: "AquaMarine", amount: 350, avatar: "🌊" },
  { name: "GoldenDragon", amount: 200, avatar: "🐉" },
  { name: "StarGazer", amount: 100, avatar: "🌟" },
];

const AlertPreview = ({ config, playing, username }) => {
  const userName = username || "Shadow King";
  const amount = 500;

  // Render template with customized colors
  const template = config.template || "{user} โดเนท {amount} บาท";
  const parts = template.split(/(\{user\}|\{amount\})/g);

  // Filter effect class
  const getFilterClass = () => {
    switch (config.filterEffect) {
      case "Shake":
        return "animate-bounce";
      case "Pulse":
        return "animate-pulse";
      case "Glow":
        return "drop-shadow-[0_0_16px_rgba(192,132,252,0.8)]";
      case "Glitch":
        return "skew-x-2 filter drop-shadow-[2px_2px_0px_#f43f5e]";
      case "Wave":
        return "animate-pulse";
      default:
        return "";
    }
  };

  const strokeStyle = config.strokeSize
    ? {
        WebkitTextStroke: `${config.strokeSize}px ${config.strokeColor || "#000000"}`,
      }
    : {};

  const animationClass = playing
    ? `anim-${config.animationIn || "bounceIn"}`
    : "";

  return (
    <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center p-4 relative overflow-hidden select-none">
      <div
        className={`flex flex-col items-center justify-center transition-all ${animationClass}`}
        style={playing ? { animationDuration: `${config.durationIn || 0.8}s` } : {}}
      >
        {/* Alert Icon & Image */}
        {config.overlayImage ? (
          <img
            src={config.overlayImage}
            alt="overlay"
            className="mb-2 max-h-24 max-w-24 rounded-2xl object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
          />
        ) : (
          <div className="mb-2.5 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/50 bg-[#16122a]/95 text-purple-300 shadow-[0_0_30px_rgba(168,85,247,0.5)] backdrop-blur-md">
            <Bell size={32} className={playing ? "animate-bounce" : ""} />
          </div>
        )}

        {/* Styled Message Text with Real-time Typography */}
        <div
          className={`mt-2 ${getFilterClass()} transition-all`}
          style={{
            fontFamily: config.fontFamily || "Kanit",
            fontWeight: config.fontWeight || "700",
            fontSize: `${Math.min(32, Math.max(16, (config.fontSize || 28) * 0.75))}px`,
            color: config.textColor || "#ffffff",
            ...strokeStyle,
          }}
        >
          <p className="leading-snug">
            {parts.map((part, idx) => {
              if (part === "{user}") {
                return (
                  <span
                    key={idx}
                    style={{ color: config.userNameColor || "#c084fc" }}
                    className="font-bold"
                  >
                    {userName}
                  </span>
                );
              }
              if (part === "{amount}") {
                return (
                  <span
                    key={idx}
                    style={{ color: config.amountColor || "#fbbf24" }}
                    className="font-bold"
                  >
                    {amount.toLocaleString()}
                  </span>
                );
              }
              return <span key={idx}>{part}</span>;
            })}
          </p>
        </div>

        {/* Shine Effect Overlay */}
        {config.shineEffect && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-extrabold text-amber-300 drop-shadow-md">
            <Sparkles size={12} className="animate-spin" />
            <span>✨ DONATION ALERT ✨</span>
            <Sparkles size={12} className="animate-spin" />
          </div>
        )}

        {/* กรอบข้อความโดเนทจากผู้สนับสนุน (ตรงกับ Overlay จริง) */}
        <div className="mt-3 max-w-[280px] rounded-xl border border-white/10 bg-[#0f0d1b]/95 px-4 py-2 text-xs font-medium text-white/95 shadow-xl backdrop-blur-md">
          <p className="break-words leading-relaxed text-gray-200">
            "ขอเพลงโปรดหน่อยครับ เล่นเกมเก่งมาก!"
          </p>
        </div>
      </div>

      {/* Playing simulation indicator */}
      {playing && (
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          กำลังเล่นแอนิเมชั่น · {config.durationDisplay || 5} วินาที
        </div>
      )}
    </div>
  );
};

const GoalPreview = ({ config }) => {
  const current = Number(config.current) || 0;
  const target = Math.max(1, Number(config.target) || 10000);
  const percent = Math.min(100, Math.round((current / target) * 100));

  const themeObj = GOAL_THEMES.find((t) => t.id === config.theme) || GOAL_THEMES[0];

  return (
    <div className="flex h-full min-h-[260px] flex-col justify-center px-4 py-3">
      {/* Title */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={18} style={{ color: themeObj.color }} />
          <span className="text-sm font-bold text-white tracking-wide">
            {config.title || "เป้าหมายโดเนท"}
          </span>
        </div>
        <span
          className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#181230] border"
          style={{ borderColor: themeObj.color, color: themeObj.color }}
        >
          {percent}%
        </span>
      </div>

      {/* Progress Bar with Glow */}
      <div className="h-5 overflow-hidden rounded-full bg-[#150f28] border border-[#2e2648] p-0.5 shadow-inner">
        <div
          className={`h-full rounded-full bg-linear-to-r ${themeObj.gradient} transition-all duration-500 shadow-[0_0_16px_var(--glow)]`}
          style={{
            width: `${percent}%`,
            "--glow": themeObj.glow,
          }}
        />
      </div>

      {/* Stats and Date Range */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-300">
        <span className="font-bold font-mono">
          {current.toLocaleString()} / {target.toLocaleString()} บาท
        </span>
        {config.startDate && config.endDate && (
          <span className="text-[10px] text-gray-500">
            {config.startDate} ถึง {config.endDate}
          </span>
        )}
      </div>
    </div>
  );
};

const LeaderboardPreview = ({ config }) => {
  const limit = Math.max(1, Math.min(10, Number(config.limit) || 5));
  const rows = SAMPLE_DONORS.slice(0, limit);

  return (
    <div className="min-h-[260px] p-2 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#2e2648]">
        <div className="flex items-center gap-2 text-purple-300">
          <Trophy size={18} className="text-amber-400" />
          <span className="text-sm font-bold text-white">
            {config.title || "TOP SUPPORTERS"}
          </span>
        </div>
        <span className="text-[10px] text-gray-400">แสดง {limit} อันดับ</span>
      </div>

      <div className="space-y-2">
        {rows.map((donor, index) => {
          const isFirst = index === 0;
          const isSecond = index === 1;
          const isThird = index === 2;

          return (
            <div
              key={donor.name}
              className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                isFirst
                  ? "border-amber-500/40 bg-amber-950/20 text-white shadow-[0_0_12px_rgba(234,179,8,0.15)]"
                  : isSecond
                  ? "border-gray-400/40 bg-gray-800/20 text-white"
                  : isThird
                  ? "border-amber-700/40 bg-amber-950/10 text-white"
                  : "border-[#251e3d] bg-[#141026] text-gray-300"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isFirst ? (
                  <Crown size={15} className="text-amber-400" />
                ) : isSecond ? (
                  <Medal size={15} className="text-gray-300" />
                ) : isThird ? (
                  <Medal size={15} className="text-amber-600" />
                ) : (
                  <span className="w-4 text-center font-bold text-[11px] text-gray-500">
                    {index + 1}
                  </span>
                )}
                <span className="font-semibold">{donor.name}</span>
              </div>

              {config.showAmount !== false && (
                <span className="font-bold text-amber-300 font-mono">
                  {donor.amount.toLocaleString()} ฿
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MissionPreview = ({ config }) => {
  const missions = config.missions || [];

  return (
    <div className="min-h-[260px] p-2 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#2e2648]">
        <div className="flex items-center gap-2 text-purple-300">
          <Flag size={18} className="text-purple-400" />
          <span className="text-sm font-bold text-white">
            {config.title || "ภารกิจโดเนท"}
          </span>
        </div>
        <span className="text-[10px] text-purple-300 font-semibold">
          {missions.length} ภารกิจ
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {missions.map((m, idx) => (
          <div
            key={m.id || idx}
            className="p-3 rounded-xl border border-[#2e2648] bg-[#141026] flex items-center justify-between hover:border-purple-500/40 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#22183c] text-[10px] font-bold text-purple-300">
                {idx + 1}
              </span>
              <span className="text-xs font-semibold text-gray-200">
                {m.name}
              </span>
            </div>
            <span className="text-xs font-extrabold text-amber-400 font-mono ml-2 shrink-0">
              {m.price} ฿
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const WidgetPreview = ({ type, config, playing, username }) => {
  return (
    <section className="rounded-2xl border border-[#2b2542] bg-[#16122a]/80 p-5 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#80779b]">
          Real-time Preview
        </p>
      </div>
      <div className="rounded-2xl border border-[#2e2648] bg-[#0c0a18] p-3 shadow-inner">
        {type === "alert" && (
          <AlertPreview config={config} playing={playing} username={username} />
        )}
        {type === "goal" && <GoalPreview config={config} />}
        {type === "leaderboard" && <LeaderboardPreview config={config} />}
        {type === "mission" && <MissionPreview config={config} />}
      </div>
    </section>
  );
};

export default WidgetPreview;
