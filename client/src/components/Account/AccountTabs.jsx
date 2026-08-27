import React, { useState } from "react";
import SocialMediaTab from "./SocialMediaTab";
import UserInfoTab from "./UserInfoTab";
import SecurityTab from "./SecurityTab";

const tabs = [
  { key: "social", label: "โซเชียลมีเดีย" },
  { key: "info", label: "ข้อมูลผู้ใช้งาน" },
  { key: "security", label: "ความปลอดภัย" },
];

const AccountTabs = ({ user }) => {
  const [activeTab, setActiveTab] = useState("social");

  return (
    <div>
      {/* Tab Switcher */}
      <div className="mb-4 inline-flex items-center gap-1 rounded-xl border border-[#2e2648] bg-[#110d22]/70 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
              activeTab === tab.key
                ? "bg-[#8b5cf6] text-white shadow-[0_0_16px_rgba(139,92,246,0.35)]"
                : "text-[#9891ab] hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "social" && <SocialMediaTab />}
      {activeTab === "info" && <UserInfoTab user={user} />}
      {activeTab === "security" && <SecurityTab />}
    </div>
  );
};

export default AccountTabs;