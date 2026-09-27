import React from "react";
import { Sparkles } from "lucide-react";

const WidgetHeader = () => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#aa8df1]">
          WIDGETS
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
          วิดเจ็ต<span className="text-[#a855f7]">รับเงิน</span>
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-[#8c859c]">
          ตั้งค่าวิดเจ็ต แล้วคัดลอก URL ไปวางใน Browser Source
          เพื่อแสดงบนหน้าจอไลฟ์
        </p>
      </div>
      <div className="flex items-center gap-2 self-start rounded-full border border-purple-500/30 bg-purple-600/10 px-3 py-1.5 text-xs font-medium text-purple-200">
        <Sparkles size={13} className="text-purple-400" />4 วิดเจ็ตที่ใช้งานได้
      </div>
    </div>
  );
};

export default WidgetHeader;
