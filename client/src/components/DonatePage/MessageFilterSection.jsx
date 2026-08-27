import React, { useState } from "react";
import SettingsCard from "./SettingsCard";
import { ChevronDown, Plus, X } from "lucide-react";

const MessageFilterSection = () => {
  const [charLimit, setCharLimit] = useState("100");
  const [disableFilter, setDisableFilter] = useState(false);
  const [customWords, setCustomWords] = useState(["คำหยาบ", "สแปม"]);
  const [inputWord, setInputWord] = useState("");

  const handleAddWord = (e) => {
    e?.preventDefault();
    const trimmed = inputWord.trim();
    if (trimmed && !customWords.includes(trimmed)) {
      setCustomWords([...customWords, trimmed]);
      setInputWord("");
    }
  };

  const handleRemoveWord = (wordToRemove) => {
    setCustomWords(customWords.filter((w) => w !== wordToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddWord();
    }
  };

  const handleSave = () => {
    console.log("Saving message filter settings:", {
      charLimit,
      disableFilter,
      customWords,
    });
  };

  return (
    <SettingsCard
      title="ตัวกรองข้อความ"
      subtitle="MESSAGES FILTER"
      onSave={handleSave}
    >
      {/* 1. Character Limit Dropdown */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#d4cfdf]">
          จำกัดจำนวนตัวอักษร
        </label>
        <div className="relative">
          <select
            value={charLimit}
            onChange={(e) => setCharLimit(e.target.value)}
            className="w-full appearance-none rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-2.5 text-xs font-medium text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all cursor-pointer pr-10"
          >
            <option value="50" className="bg-[#16122a] text-white">
              จำกัดข้อความไม่เกิน 50 ตัวอักษร
            </option>
            <option value="100" className="bg-[#16122a] text-white">
              จำกัดข้อความไม่เกิน 100 ตัวอักษร
            </option>
            <option value="150" className="bg-[#16122a] text-white">
              จำกัดข้อความไม่เกิน 150 ตัวอักษร
            </option>
            <option value="200" className="bg-[#16122a] text-white">
              จำกัดข้อความไม่เกิน 200 ตัวอักษร
            </option>
            <option value="unlimited" className="bg-[#16122a] text-white">
              ไม่จำกัดจำนวนตัวอักษร
            </option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* 2. Disable Filter Toggle Row */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-[#2e2648]/60 bg-[#110d22]/50 p-3.5">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-[#d4cfdf]">
            ปิดการกรองข้อความ
          </p>
          <p className="text-[10px] text-[#7e778d] leading-relaxed">
            อนุญาตให้แสดงข้อความทั้งหมดโดยไม่ผ่านการกรอง (ข้อความที่ไม่สุภาพอาจถูกบล็อกโดยระบบอัตโนมัติ)
          </p>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={disableFilter}
          onClick={() => setDisableFilter(!disableFilter)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            disableFilter ? "bg-purple-600" : "bg-[#2b2444]"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
              disableFilter ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* 3. Custom Filtered Words Input & Tag Chips */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#d4cfdf]">
          เพิ่มคำที่กรองของคุณเอง
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputWord}
            onChange={(e) => setInputWord(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="พิมพ์คำที่ไม่ต้องการและกด Enter หรือปุ่มเพิ่ม"
            className="flex-1 rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-2 text-xs font-medium text-white placeholder-[#6e6682] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
          />
          <button
            type="button"
            onClick={handleAddWord}
            className="flex items-center gap-1.5 rounded-xl border border-[#3c325c] bg-[#221a3e] px-4 py-2 text-xs font-medium text-purple-200 hover:bg-purple-600 hover:text-white transition-colors"
          >
            <Plus size={14} />
            <span>เพิ่ม</span>
          </button>
        </div>

        {/* Tag Chips */}
        {customWords.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {customWords.map((word) => (
              <span
                key={word}
                className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-950/40 px-2.5 py-1 text-[11px] font-medium text-purple-300"
              >
                {word}
                <button
                  type="button"
                  onClick={() => handleRemoveWord(word)}
                  className="text-purple-400 hover:text-red-400 transition-colors ml-0.5"
                  title={`ลบคำว่า "${word}"`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </SettingsCard>
  );
};

export default MessageFilterSection;
