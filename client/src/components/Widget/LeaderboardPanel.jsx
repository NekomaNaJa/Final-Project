import React from "react";
import SettingsCard from "../DonatePage/SettingsCard";
import AccordionSection from "./AccordionSection";
import { Plus, Minus } from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-2.5 text-xs sm:text-sm font-medium text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all";

const labelClass = "text-xs font-semibold text-[#d4cfdf]";

const LeaderboardPanel = ({ value, onChange, onSave }) => {
  const update = (fields) => {
    onChange({ ...value, ...fields });
  };

  const handleLimitChange = (delta) => {
    const current = Number(value.limit) || 5;
    const next = Math.max(1, Math.min(10, current + delta));
    update({ limit: next });
  };

  return (
    <SettingsCard
      title="Leaderboard"
      subtitle="TOP SUPPORTERS RANKING"
      onSave={onSave}
    >
      {/* 1. หัวข้อ & การแสดงผล */}
      <AccordionSection title="ข้อมูลการจัดอันดับ" defaultOpen={true}>
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>ชื่อหัวข้อบนจอ</label>
            <input
              type="text"
              value={value.title || ""}
              onChange={(e) => update({ title: e.target.value })}
              className={inputClass}
              placeholder="เช่น TOP 5 ผู้สนับสนุนประจำเดือน"
            />
          </div>

          {/* Show Amount Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-[#2e2648] bg-[#141026]">
            <div>
              <p className="text-xs font-bold text-white">แสดงยอดเงิน (บาท)</p>
              <p className="text-[10px] text-[#7e778d]">
                เปิดเพื่อแสดงตัวเลขยอดรวมที่แต่ละคนโดเนท
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value.showAmount !== false}
                onChange={(e) => update({ showAmount: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#2b2542] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Number of Ranks Stepper (1-10) */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-[#2e2648] bg-[#141026]">
            <div>
              <p className="text-xs font-bold text-white">
                จำนวนอันดับที่แสดง (1–10)
              </p>
              <p className="text-[10px] text-[#7e778d]">
                กำหนดจำนวนผู้สนับสนุนที่จะขึ้นแสดงบน Overlay
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleLimitChange(-1)}
                disabled={(value.limit || 5) <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#31284d] bg-[#1d1738] text-white hover:bg-purple-600 disabled:opacity-30 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center font-bold text-sm text-purple-300">
                {value.limit || 5}
              </span>
              <button
                type="button"
                onClick={() => handleLimitChange(1)}
                disabled={(value.limit || 5) >= 10}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#31284d] bg-[#1d1738] text-white hover:bg-purple-600 disabled:opacity-30 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* 2. ช่วงเวลา (Date Range) */}
      <AccordionSection title="ช่วงเวลาสะสมยอด" defaultOpen={true}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>วันเริ่มต้น</label>
            <input
              type="date"
              value={value.startDate || ""}
              onChange={(e) => update({ startDate: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>วันสิ้นสุด</label>
            <input
              type="date"
              value={value.endDate || ""}
              onChange={(e) => update({ endDate: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </AccordionSection>
    </SettingsCard>
  );
};

export default LeaderboardPanel;
