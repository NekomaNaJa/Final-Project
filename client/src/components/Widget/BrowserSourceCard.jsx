import React, { useState } from "react";
import { Copy, Check, Play, Info } from "lucide-react";
import { getBrowserSourceUrl } from "./widgetStorage";

const RECOMMENDED_SIZES = {
  alert: "800 x 600 px",
  goal: "650 x 260 px",
  leaderboard: "600 x 700 px",
};

const BrowserSourceCard = ({ type, username, token, isLive = true, onTest }) => {
  const [copied, setCopied] = useState(false);
  const targetId = token || username || "";
  const url = getBrowserSourceUrl(type, targetId);

  const handleCopy = async () => {
    if (!targetId) return;
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (type === "mission") {
    return (
      <section className="rounded-2xl border border-[#2b2542] bg-[#16122a]/80 p-5 backdrop-blur-md shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#80779b]">
            สถานะวิดเจ็ต
          </p>
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              ยังไม่ได้บันทึก
            </span>
          )}
        </div>
        <div className="flex items-start gap-2.5 p-3 rounded-xl border border-[#2e2648] bg-[#110d22] text-xs text-[#8e87a2] leading-relaxed">
          <Info size={16} className="text-purple-400 shrink-0 mt-0.5" />
          <p>
            วิดเจ็ต Mission Donate จะไปแสดงผลบน **หน้ารับเงิน (Donor Page)** โดยตรง ไม่ต้องใช้ Browser Source URL ใน OBS
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#2b2542] bg-[#16122a]/80 p-5 backdrop-blur-md shadow-xl space-y-3.5">
      {/* Header & Live Status Badge */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#80779b]">
          Browser Source URL
        </p>
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            ยังไม่ได้บันทึก
          </span>
        )}
      </div>

      {/* URL Display Box */}
      <div className="rounded-xl border border-[#2e2648] bg-[#110d22] p-2.5 shadow-inner">
        {targetId ? (
          <p className="break-all font-mono text-[11px] text-purple-200 select-all">
            {url}
          </p>
        ) : (
          <p className="font-mono text-[11px] text-gray-500 animate-pulse">
            กำลังโหลด Token วิดเจ็ต...
          </p>
        )}
      </div>

      {RECOMMENDED_SIZES[type] && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl border border-[#2b2542] bg-[#110d22] text-[11px]">
          <span className="text-[#8e87a2]">ขนาดที่แนะนำใน OBS:</span>
          <span className="font-mono font-bold text-purple-300">
            {RECOMMENDED_SIZES[type]}
          </span>
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-[#7e778d]">
        คัดลอก URL นี้ไปวางใน Browser Source ของ OBS Studio (แนะนำให้กำหนดขนาด Width x Height ในหน้า Properties ของ OBS โดยตรงแทนการลากยืดกรอบสีแดง เพื่อให้ตัวหนังสือคมชัดสูงสุด ไม่แตก)
      </p>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!targetId}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-[#2e2648] bg-[#1a1630] py-2.5 px-3 text-xs font-semibold text-white hover:border-purple-500/50 hover:bg-[#251d45] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          <span>{copied ? "คัดลอกแล้ว!" : "คัดลอก URL"}</span>
        </button>

        <button
          type="button"
          onClick={onTest}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] py-2.5 px-3 text-xs font-bold text-white shadow-[0_0_16px_rgba(139,92,246,0.35)] active:scale-95 transition-all cursor-pointer"
        >
          <Play size={14} />
          <span>ทดสอบ Alert</span>
        </button>
      </div>
    </section>
  );
};

export default BrowserSourceCard;
