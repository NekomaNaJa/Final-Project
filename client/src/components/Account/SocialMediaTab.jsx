import React, { useState } from "react";
import SettingsCard from "../DonatePage/SettingsCard";
import { socialPlatforms } from "../../constants/socialPlatforms";


const SocialMediaTab = () => {
  const [socialLinks, setSocialLinks] = useState({
    facebook: "",
    instagram: "",
    youtube: "",
    tiktok: "",
    twitch: "",
    x: "",
  });

  const handleChange = (key, value) => {
    setSocialLinks((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    console.log("Saving account social links:", socialLinks);
  };

  return (
    <SettingsCard title="โซเชียลมีเดีย" subtitle="SOCIAL MEDIA" onSave={handleSave}>
      <div className="grid gap-4 sm:grid-cols-2">
        {socialPlatforms.map(({ key, label, icon }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label htmlFor={`account-social-${key}`} className="text-[11px] font-bold tracking-wider text-[#9891ab]">
              {label}
            </label>
            <div className="relative flex items-center rounded-xl border border-[#2e2648] bg-[#110d22] px-3 py-2 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/30 transition-all">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center mr-2.5">
                {icon}
              </div>
              <input
                id={`account-social-${key}`}
                type="text"
                value={socialLinks[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder="ยังไม่ได้เชื่อมต่อ"
                className="w-full bg-transparent text-xs text-white placeholder-[#5c556f] focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    </SettingsCard>
  );
};

export default SocialMediaTab;