import React, { useState } from "react";
import SettingsCard from "../DonatePage/SettingsCard";

const socialPlatforms = [
  {
    key: "facebook",
    label: "FACEBOOK",
    icon: (
      <svg className="w-4 h-4 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    key: "instagram",
    label: "INSTAGRAM",
    icon: (
      <svg className="w-4 h-4 text-[#E4405F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "youtube",
    label: "YOUTUBE",
    icon: (
      <svg className="w-4 h-4 text-[#FF0000]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    key: "tiktok",
    label: "TIKTOK",
    icon: (
      <svg className="w-4 h-4 text-[#00F2FE]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.81 4.48 6.27 6.27 0 0 0 1.86-4.48v-6.9a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.85-.19z" />
      </svg>
    ),
  },
  {
    key: "twitch",
    label: "TWITCH",
    icon: (
      <svg className="w-4 h-4 text-[#9146FF]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
      </svg>
    ),
  },
  {
    key: "x",
    label: "X",
    icon: (
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

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
            <label className="text-[11px] font-bold tracking-wider text-[#9891ab]">
              {label}
            </label>
            <div className="relative flex items-center rounded-xl border border-[#2e2648] bg-[#110d22] px-3 py-2 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/30 transition-all">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center mr-2.5">
                {icon}
              </div>
              <input
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