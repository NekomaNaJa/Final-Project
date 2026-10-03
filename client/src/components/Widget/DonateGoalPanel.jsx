import React from "react";
import SettingsCard from "../DonatePage/SettingsCard";
import AccordionSection from "./AccordionSection";
import { GOAL_THEMES } from "./widgetStorage";

const inputClass =
  "w-full rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-2.5 text-xs sm:text-sm font-medium text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all";

const labelClass = "text-xs font-semibold text-[#d4cfdf]";

const DonateGoalPanel = ({ value, onChange, onSave }) => {
  const update = (fields) => {
    onChange({ ...value, ...fields });
  };

  return (
    <SettingsCard
      title="Donate Goal"
      subtitle="GOAL PROGRESS BAR"
      onSave={onSave}
    >
      {/* 1. ข้อมูลเป้าหมาย (Goal Details) */}
      <AccordionSection title="ข้อมูลเป้าหมาย" defaultOpen={true}>
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>ชื่อเป้าหมาย</label>
            <input
              type="text"
              value={value.title || ""}
              onChange={(e) => update({ title: e.target.value })}
              className={inputClass}
              placeholder="เช่น เป้าหมายพัฒนาสตรีม, ซื้อไมโครโฟนใหม่"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>ยอดเริ่มต้น (บาท)</label>
              <input
                type="number"
                min="0"
                value={value.current ?? 0}
                onChange={(e) => update({ current: Number(e.target.value) })}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>ยอดเป้าหมาย (บาท)</label>
              <input
                type="number"
                min="1"
                value={value.target ?? 10000}
                onChange={(e) => update({ target: Number(e.target.value) })}
                className={inputClass}
                placeholder="10000"
              />
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* 2. ธีมสี (Color Themes) */}
      <AccordionSection title="ธีมสีของหลอดเป้าหมาย" defaultOpen={true}>
        <div className="space-y-3">
          <label className={labelClass}>เลือกธีมสี</label>
          <div className="grid gap-3 sm:grid-cols-3">
            {GOAL_THEMES.map((theme) => {
              const isSelected = (value.theme || "mana") === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => update({ theme: theme.id })}
                  className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-purple-400 bg-[#251d45] shadow-[0_0_16px_rgba(168,85,247,0.3)]"
                      : "border-[#2e2648] bg-[#141026] hover:border-purple-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-xs font-bold text-white">
                      {theme.label}
                    </span>
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-linear-to-r ${theme.gradient} shadow-sm`}
                    />
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#110d22] overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full bg-linear-to-r ${theme.gradient}`}
                      style={{ width: "65%" }}
                    />
                  </div>
                  <span className="text-[10px] text-[#7e778d]">
                    {theme.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </AccordionSection>

      {/* 3. ระยะเวลากำหนด (Date Range) */}
      <AccordionSection title="ระยะเวลาเป้าหมาย" defaultOpen={true}>
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

export default DonateGoalPanel;
