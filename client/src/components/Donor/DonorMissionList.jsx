import React from "react";
import { Target, Check, X, Sparkles } from "lucide-react";

const DonorMissionList = ({
  missionConfig,
  selectedMission = null,
  onSelectMission,
  disabled = false,
}) => {
  const missions = missionConfig?.missions || [];
  const title = missionConfig?.title || "ภารกิจสตรีมเมอร์วันนี้";

  if (!missions.length) {
    return null;
  }

  return (
    <div
      data-testid="donor-mission-list"
      className="space-y-3.5 rounded-2xl border border-[#2e2648] bg-[#120d24]/90 p-4 sm:p-5 shadow-lg"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#251d3b]">
        <div className="flex items-center gap-2 text-white">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-purple-600 to-indigo-600 text-white shadow-md">
            <Target size={16} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
              {title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-purple-300">
            <Sparkles size={12} className="text-amber-400" />
            <span>{missions.length} ภารกิจ</span>
          </span>

          {selectedMission && (
            <button
              type="button"
              data-testid="clear-mission-btn"
              onClick={() => onSelectMission(null)}
              disabled={disabled}
              className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-950/30 px-2 py-0.5 text-[11px] font-semibold text-red-300 hover:bg-red-900/40 hover:text-white transition-colors cursor-pointer"
              title="ยกเลิกการเลือกภารกิจ"
            >
              <X size={12} />
              <span>ยกเลิก</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtitle / Hint */}
      <p className="text-xs text-gray-400">
        เลือกภารกิจที่ต้องการให้สตรีมเมอร์ทำ ระบบจะกำหนดยอดเงินและแท็กภารกิจในข้อความให้อัตโนมัติ
      </p>

      {/* Mission Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {missions.map((mission, index) => {
          const isSelected = selectedMission?.id === mission.id;

          return (
            <button
              key={mission.id || index}
              type="button"
              aria-pressed={isSelected}
              data-testid={`mission-item-${mission.id || index}`}
              disabled={disabled}
              onClick={() =>
                onSelectMission(isSelected ? null : mission)
              }
              className={`group flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? "border-purple-500 bg-[#251744] text-white shadow-[0_0_18px_rgba(168,85,247,0.35)] ring-1 ring-purple-400"
                  : "border-[#282142] bg-[#151029] hover:border-purple-500/50 hover:bg-[#1a1433] text-gray-200"
              }`}
            >
              {/* Left: Index badge and Name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    isSelected
                      ? "bg-purple-600 text-white"
                      : "bg-[#22183c] text-purple-300 group-hover:bg-purple-900/60"
                  }`}
                >
                  {isSelected ? <Check size={14} /> : index + 1}
                </div>
                <span className="text-xs sm:text-sm font-semibold truncate">
                  {mission.name}
                </span>
              </div>

              {/* Right: Price */}
              <div className="shrink-0 flex items-center gap-1.5">
                <span
                  className={`font-mono text-xs sm:text-sm font-extrabold ${
                    isSelected ? "text-amber-300" : "text-amber-400"
                  }`}
                >
                  {Number(mission.price).toLocaleString()} ฿
                </span>
                {isSelected && (
                  <span className="rounded bg-purple-500/30 px-1.5 py-0.5 text-[10px] font-bold text-purple-200">
                    เลือกอยู่
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Mission Status Banner */}
      {selectedMission && (
        <div
          data-testid="selected-mission-banner"
          className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/30 text-xs text-purple-200 animate-in fade-in"
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-amber-400">🎯 ภารกิจที่เลือก:</span>
            <span className="font-semibold text-white truncate">
              {selectedMission.name}
            </span>
          </div>
          <span className="shrink-0 font-mono font-bold text-amber-300">
            {Number(selectedMission.price).toLocaleString()} บาท
          </span>
        </div>
      )}
    </div>
  );
};

export default DonorMissionList;
