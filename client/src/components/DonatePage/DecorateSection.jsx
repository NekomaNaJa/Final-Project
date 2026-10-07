import React, { useState, useEffect } from "react";
import SettingsCard from "./SettingsCard";
import RichTextField from "./RichTextField";
import ImageUploadBox from "./ImageUploadBox";
import { safeGetItem, safeSetItem, sanitizeValue } from "../../utils/sanitizeStorage";

const DecorateSection = ({ initialData, onSave }) => {
  const saved = safeGetItem("donix_donate_config", {});

  const [welcomeMessage, setWelcomeMessage] = useState(
    initialData?.welcomeMessage ?? saved.welcomeMessage ?? ""
  );
  const [thankYouMessage, setThankYouMessage] = useState(
    initialData?.thankYouMessage ?? saved.thankYouMessage ?? ""
  );
  const [minAmount, setMinAmount] = useState(
    initialData?.minAmount ?? (saved.minAmount !== undefined ? saved.minAmount : 10)
  );
  const [coverImage, setCoverImage] = useState(
    initialData?.coverImage ?? saved.coverImage ?? null
  );
  const [backgroundImage, setBackgroundImage] = useState(
    initialData?.backgroundImage ?? saved.backgroundImage ?? null
  );

  useEffect(() => {
    if (initialData) {
      if (initialData.welcomeMessage !== undefined) {
        setWelcomeMessage(initialData.welcomeMessage || "");
      }
      if (initialData.thankYouMessage !== undefined) {
        setThankYouMessage(initialData.thankYouMessage || "");
      }
      if (initialData.minAmount !== undefined) {
        setMinAmount(initialData.minAmount);
      }
      if (initialData.coverImage !== undefined) {
        setCoverImage(initialData.coverImage || null);
      }
      if (initialData.backgroundImage !== undefined) {
        setBackgroundImage(initialData.backgroundImage || null);
      }
    }
  }, [initialData]);

  const handleSave = () => {
    const cleanWelcome = sanitizeValue(welcomeMessage);
    const cleanThankYou = sanitizeValue(thankYouMessage);
    const cleanMin = Math.max(1, Number(minAmount) || 10);
    const config = {
      ...saved,
      welcomeMessage: cleanWelcome,
      thankYouMessage: cleanThankYou,
      minAmount: cleanMin,
      coverImage: typeof coverImage === "string" ? coverImage : null,
      backgroundImage: typeof backgroundImage === "string" ? backgroundImage : null,
    };
    if (onSave) {
      onSave({
        welcomeMessage: cleanWelcome,
        thankYouMessage: cleanThankYou,
        minAmount: cleanMin,
        coverImage: typeof coverImage === "string" ? coverImage : null,
        backgroundImage: typeof backgroundImage === "string" ? backgroundImage : null,
      });
    } else {
      safeSetItem("donix_donate_config", config);
    }
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
        <label htmlFor="decorate-min-amount" className="text-xs font-semibold text-[#d4cfdf]">
          จำนวนเงินขั้นต่ำ
        </label>
        <p className="text-[10px] text-[#7e778d]">
          จำนวนเงินขั้นต่ำที่ผู้สนับสนุนจะโดเนทได้
        </p>
        <div className="relative mt-0.5">
          <input
            id="decorate-min-amount"
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
