import React from "react";
import { Landmark } from "lucide-react";

const tabs = [
  {
    id: "promptpay",
    label: "พร้อมเพย์",
    icon: (
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white p-0.5 shadow-sm">
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
    ),
    guide:
      "สแกน QR พร้อมเพย์ ด้วยแอปธนาคารใดก็ได้ จากนั้นแนบรูปภาพสลิปเพื่อให้ระบบตรวจสอบสลิปอัตโนมัติ",
  },
  {
    id: "bank",
    label: "ธนาคาร",
    icon: (
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-linear-to-tr from-[#2c3e50] to-[#34495e] text-white p-0.5 shadow-sm">
        <Landmark size={16} />
      </div>
    ),
    guide:
      "โอนเงินเข้าบัญชีธนาคารตามช่องทางที่คุณสะดวก จากนั้นแนบรูปภาพสลิปเพื่อให้ระบบตรวจสอบสลิปอัตโนมัติ",
  },
  {
    id: "truemoney",
    label: "ทรูมันนี่",
    icon: (
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#FF6A00] p-0.5 shadow-sm">
        <svg viewBox="0 0 48 48" className="h-full w-full" fill="none">
          <path d="M8 8h32v32H8z" fill="#FF6A00" rx="4" />
          <path d="M14 18h20v5H26v11h-4V23h-8v-5z" fill="#fff" />
          <path d="M30 26h4v8h-4z" fill="#FFCC00" />
        </svg>
      </div>
    ),
    guide:
      "โอนเงินโดยการส่งซองของขวัญใน ทรูมันนี่วอลเปา และคัดลอกลิงก์มาวางไว้ใน DONIX",
  },
];

const DonorPaymentTabs = ({ activeTab, onTabChange }) => {
  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className="w-full space-y-3.5">
      {/* 3 Tabs */}
      <div className="grid grid-cols-3 gap-2.5 rounded-2xl border border-[#2b2542] bg-[#141026]/90 p-2 backdrop-blur-md shadow-lg">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center justify-center gap-2.5 rounded-xl py-3 px-3 text-sm sm:text-base font-bold transition-all ${
                isActive
                  ? "border border-purple-500/50 bg-[#251d45] text-white shadow-[0_0_16px_rgba(139,92,246,0.35)]"
                  : "border border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Sub-Guide Text */}
      <p className="text-xs sm:text-sm text-[#9c95b0] text-center px-3 leading-relaxed">
        {currentTab.guide}
      </p>
    </div>
  );
};

export default DonorPaymentTabs;
