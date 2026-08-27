import React, { useState } from "react";
import { Check } from "lucide-react";

const SettingsCard = ({ title, subtitle, onSave, children, className = "" }) => {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  return (
    <section
      className={`rounded-2xl border border-[#2b2542] bg-[#16122a]/80 backdrop-blur-md p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] relative transition-all ${className}`}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#80779b]">
            {subtitle}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="space-y-5">{children}</div>

      {/* Footer / Save Button */}
      <div className="mt-6 flex items-center justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          className={`flex items-center gap-2 rounded-xl px-7 py-2 text-sm font-medium transition-all active:scale-95 ${
            isSaved
              ? "bg-emerald-600 text-white shadow-[0_0_16px_rgba(16,185,129,0.4)]"
              : "bg-[#8b5cf6] text-white hover:bg-[#7c3aed] shadow-[0_0_16px_rgba(139,92,246,0.35)]"
          }`}
        >
          {isSaved ? (
            <>
              <Check size={16} />
              <span>บันทึกแล้ว</span>
            </>
          ) : (
            <span>บันทึก</span>
          )}
        </button>
      </div>
    </section>
  );
};

export default SettingsCard;
