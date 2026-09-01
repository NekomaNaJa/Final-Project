import React, { useState } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

const promptpayTypes = [
  "เบอร์โทรศัพท์",
  "เลขบัตรประจำตัวประชาชน",
  "e-Wallet ID",
  "K-Shop",
  "SCB แม่มณี",
  "BBL Merchant Pro",
  "ร้านค้าถุงเงิน",
];

const PromptPayCard = ({ initialData, onSave }) => {
  const [enabled, setEnabled] = useState(initialData?.enabled ?? true);
  const [type, setType] = useState(initialData?.type || "เบอร์โทรศัพท์");
  const [number, setNumber] = useState(initialData?.number || "");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e?.preventDefault();
    if (onSave) {
      onSave({ enabled, type, number });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-[#2b2542] bg-[#16122a]/80 backdrop-blur-md p-6 sm:p-7 shadow-xl transition-all flex flex-col justify-between hover:border-purple-500/30">
      {/* Upper Content */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        {/* Left Banner */}
        <div className="flex items-center gap-4 rounded-2xl bg-linear-to-r from-[#173e6b] to-[#1e5899] border border-blue-400/20 px-5 py-4 flex-1 shadow-md">
          {/* PromptPay Stylized Logo Badge */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
            <svg viewBox="0 0 48 48" className="h-full w-full" fill="none">
              <path d="M8 8h32v32H8z" fill="#003D6B" rx="4" />
              <path
                d="M14 16h8a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-4v6h-4V16zm4 7h4a2 2 0 0 0 0-4h-4v4z"
                fill="#fff"
              />
              <path
                d="M27 24h4a4 4 0 0 1 4 4 4 4 0 0 1-4 4h-2v4h-4V24zm4 6a1.5 1.5 0 0 0 0-3h-2v3h2z"
                fill="#00B4D8"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg sm:text-xl text-white tracking-wide">
              พร้อมเพย์
            </h3>
            <p className="text-xs text-blue-200 mt-0.5">
              รับเงินเข้าบัญชีพร้อมเพย์
            </p>
          </div>
        </div>

        {/* Right Switch & Status */}
        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#80779b]">
            PROMPTPAY
          </p>
          <div className="flex items-center gap-3">
            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enabled ? "bg-purple-600 shadow-[0_0_12px_rgba(147,51,234,0.4)]" : "bg-[#2b2444]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-sm font-semibold ${
                enabled ? "text-emerald-400" : "text-gray-500"
              }`}
            >
              {enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </span>
          </div>
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full mt-5 py-2.5 sm:py-3 rounded-xl border border-[#31284d] bg-[#1a1433]/70 hover:bg-[#231b45] text-xs sm:text-sm font-semibold text-purple-300 flex items-center justify-center gap-2 transition-all hover:border-purple-500/40"
      >
        <span>{isExpanded ? "ปิดการตั้งค่า" : "จัดการ"}</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Expandable Form Drawer */}
      {isExpanded && (
        <form
          onSubmit={handleSave}
          className="mt-5 pt-5 border-t border-[#2e2648] space-y-4"
        >
          {/* PromptPay Type Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#d4cfdf]">
              ประเภทพร้อมเพย์
            </label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#2e2648] bg-[#110d22] px-4 py-2.5 text-sm font-medium text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all cursor-pointer pr-10"
              >
                {promptpayTypes.map((t) => (
                  <option key={t} value={t} className="bg-[#16122a] text-white">
                    {t}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-gray-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {/* PromptPay Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#d4cfdf]">
              หมายเลขพร้อมเพย์
            </label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="เช่น 0812345678 หรือ 1234567890123"
              className="w-full rounded-xl border border-[#2e2648] bg-[#110d22] px-4 py-2.5 text-sm font-medium text-white placeholder-[#6e6682] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className={`flex items-center gap-2 rounded-xl px-6 py-2 text-sm font-medium transition-all active:scale-95 ${
                isSaved
                  ? "bg-emerald-600 text-white shadow-[0_0_14px_rgba(16,185,129,0.4)]"
                  : "bg-[#8b5cf6] text-white hover:bg-[#7c3aed] shadow-[0_0_14px_rgba(139,92,246,0.35)]"
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
        </form>
      )}
    </div>
  );
};

export default PromptPayCard;
