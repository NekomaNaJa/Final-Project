import React, { useState } from "react";
import { Bold, Italic, Type } from "lucide-react";

const RichTextField = ({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 3,
}) => {
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    heading: false,
  });

  const toggleFormat = (key) => {
    setActiveFormats((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-[#d4cfdf]">{label}</label>
      )}
      <div className="rounded-xl border border-[#2e2648] bg-[#110d22] overflow-hidden focus-within:border-purple-500/80 focus-within:ring-1 focus-within:ring-purple-500/30 transition-all">
        {/* Mock Toolbar */}
        <div className="flex items-center gap-1 border-b border-[#28213e] bg-[#18132f]/80 px-2.5 py-1">
          <button
            type="button"
            onClick={() => toggleFormat("bold")}
            title="ตัวหนา (Bold)"
            className={`flex h-6 w-6 items-center justify-center rounded text-xs transition-colors ${
              activeFormats.bold
                ? "bg-purple-600/30 text-purple-300 font-bold"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Bold size={13} />
          </button>
          <button
            type="button"
            onClick={() => toggleFormat("italic")}
            title="ตัวเอียง (Italic)"
            className={`flex h-6 w-6 items-center justify-center rounded text-xs transition-colors ${
              activeFormats.italic
                ? "bg-purple-600/30 text-purple-300 font-bold"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Italic size={13} />
          </button>
          <button
            type="button"
            onClick={() => toggleFormat("heading")}
            title="หัวข้อ (Heading)"
            className={`flex h-6 w-6 items-center justify-center rounded text-xs transition-colors ${
              activeFormats.heading
                ? "bg-purple-600/30 text-purple-300 font-bold"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Type size={13} />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-transparent px-3 py-2 text-xs leading-relaxed text-gray-200 placeholder-[#6e6682] focus:outline-none resize-none ${
            activeFormats.bold ? "font-bold" : ""
          } ${activeFormats.italic ? "italic" : ""}`}
        />
      </div>
    </div>
  );
};

export default RichTextField;
