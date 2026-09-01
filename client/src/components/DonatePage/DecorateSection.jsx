import React, { useState } from "react";
import SettingsCard from "./SettingsCard";
import RichTextField from "./RichTextField";
import ImageUploadBox from "./ImageUploadBox";

const DecorateSection = () => {
  const getSaved = () => {
    try {
      return JSON.parse(localStorage.getItem("donix_donate_config")) || {};
    } catch {
      return {};
    }
  };
  const saved = getSaved();

  const [welcomeMessage, setWelcomeMessage] = useState(saved.welcomeMessage || "");
  const [thankYouMessage, setThankYouMessage] = useState(saved.thankYouMessage || "");
  const [minAmount, setMinAmount] = useState(saved.minAmount !== undefined ? saved.minAmount : 10);
  const [coverImage, setCoverImage] = useState(saved.coverImage || null);
  const [backgroundImage, setBackgroundImage] = useState(saved.backgroundImage || null);

  const handleSave = () => {
    const config = {
      ...saved,
      welcomeMessage,
      thankYouMessage,
      minAmount,
      coverImage,
      backgroundImage,
    };
    localStorage.setItem("donix_donate_config", JSON.stringify(config));
    console.log("Saved donate page settings:", config);
  };

  return (
    <SettingsCard
      title="ตกแต่งหน้ารับเงินของคุณ"
      subtitle="DONATE PAGE SETTINGS"
      onSave={handleSave}
    >
      {/* 2 Columns: Welcome Message & Thank You Message */}
      <div className="grid gap-4 sm:grid-cols-2">
        <RichTextField
          label="ข้อความต้อนรับ"
          placeholder="แนะนำตัวสั้นๆ ให้ผู้สนับสนุนรู้จักคุณ"
          value={welcomeMessage}
          onChange={setWelcomeMessage}
          rows={3}
        />
        <RichTextField
          label="ข้อความขอบคุณ"
          placeholder="ข้อความขอบคุณที่จะแสดงให้ผู้สนับสนุนเห็นหลังจากโดเนทสำเร็จ"
          value={thankYouMessage}
          onChange={setThankYouMessage}
          rows={3}
        />
      </div>

      {/* Full Width: Minimum Amount */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#d4cfdf]">
          จำนวนเงินขั้นต่ำ
        </label>
        <p className="text-[10px] text-[#7e778d]">
          จำนวนเงินขั้นต่ำที่ผู้สนับสนุนจะโดเนทได้
        </p>
        <div className="relative mt-0.5">
          <input
            type="number"
            min="0"
            step="1"
            value={minAmount}
            onChange={(e) => setMinAmount(Number(e.target.value))}
            className="w-full rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-2 text-xs font-medium text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
            placeholder="เช่น 1 หรือ 10"
          />
        </div>
      </div>

      {/* 2 Columns: Cover Image & Background Image */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUploadBox
          label="รูปภาพหน้าปก"
          onImageSelect={(file) => setCoverImage(file)}
        />
        <ImageUploadBox
          label="รูปภาพพื้นหลัง"
          onImageSelect={(file) => setBackgroundImage(file)}
        />
      </div>
    </SettingsCard>
  );
};

export default DecorateSection;
