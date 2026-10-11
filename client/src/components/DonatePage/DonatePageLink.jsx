import React, { useState } from "react";
import { Eye, Copy, Check, ExternalLink } from "lucide-react";

const PRODUCTION_URL = "https://final-project-orpin-five.vercel.app";

const getBaseUrl = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    if (
      !window.location.hostname.includes("localhost") &&
      !window.location.hostname.includes("127.0.0.1")
    ) {
      return window.location.origin;
    }
  }
  return PRODUCTION_URL;
};

const DonatePageLink = ({ username = "Test", baseUrl = null }) => {
  const [copied, setCopied] = useState(false);
  const resolvedBaseUrl = baseUrl || getBaseUrl();
  const donateUrl = `${resolvedBaseUrl}/${username}`;
  const displayHost = donateUrl.replace(/^https?:\/\//, "");

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(donateUrl);
      }
    } catch {
      // Ignore clipboard write failure
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center text-center space-y-4 pt-2 pb-4">
      {/* Subtitle & Title */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#aa8df1]">
          DONOR URL
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
          ลิงก์หน้า <span className="text-[#a855f7]">รับเงิน</span> ของคุณ
        </h1>
      </div>

      {/* URL Box & Action Icons */}
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-2 rounded-2xl border border-[#2d2747] bg-[#141026]/80 backdrop-blur-md p-2 pl-4 shadow-lg focus-within:border-purple-500/60 transition-all">
          <input
            type="text"
            readOnly
            value={donateUrl}
            onClick={handleCopy}
            className="flex-1 bg-transparent text-xs sm:text-sm font-medium text-gray-200 focus:outline-none cursor-pointer select-all"
          />

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopy}
            title="คัดลอกลิงก์"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#261f3d] text-gray-300 hover:bg-purple-600 hover:text-white transition-colors"
          >
            {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
          </button>
        </div>

        {copied && (
          <p className="mt-1 text-[11px] font-medium text-emerald-400">
            คัดลอกลิงก์ไปยังคลิปบอร์ดแล้ว!
          </p>
        )}

        <p className="mt-2 text-xs text-[#7e778d] leading-relaxed">
          ผู้คนสามารถโดเนทให้คุณได้ผ่านลิงก์นี้ กรุณานำลิงก์ไปแสดงในช่องทางการสตรีมของคุณ หรือในคำอธิบายวิดีโอของคุณ
        </p>
      </div>

      {/* Preview Button Bar */}
      <div className="w-full max-w-xl">
        <a
          href={`/${username}`}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center justify-between rounded-full border border-purple-500/30 bg-[#16122d]/70 backdrop-blur-md px-4 py-2.5 shadow-[0_0_20px_rgba(124,58,237,0.15)] hover:border-purple-500/60 hover:bg-[#1e173e]/80 hover:shadow-[0_0_24px_rgba(124,58,237,0.25)] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600/30 text-purple-300">
              <Eye size={15} />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
              ดูตัวอย่างหน้ารับเงินของคุณได้ที่นี่
            </span>
          </div>

          <span className="flex items-center gap-1 rounded-full border border-purple-500/40 bg-purple-600/25 px-3 py-1 text-[11px] font-medium text-purple-200">
            <span className="truncate max-w-[200px] sm:max-w-xs">{displayHost}</span>
            <ExternalLink size={12} className="shrink-0" />
          </span>
        </a>
      </div>
    </div>
  );
};

export default DonatePageLink;
