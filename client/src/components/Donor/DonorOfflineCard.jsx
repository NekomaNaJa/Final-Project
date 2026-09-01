import React from "react";
import { Ban } from "lucide-react";

const DonorOfflineCard = () => {
  return (
    <div className="w-full rounded-2xl border border-[#2b2542] bg-[#16122a]/90 backdrop-blur-md p-12 sm:p-16 flex flex-col items-center justify-center text-center shadow-2xl">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 mb-5 shadow-inner">
        <Ban size={34} className="text-gray-400" />
      </div>
      <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-wide">
        ขณะนี้ปิดรับโดเนทชั่วคราว
      </h2>
      <p className="text-xs sm:text-sm text-[#9c95b0] mt-1.5">
        สตรีมเมอร์ยังไม่ได้เปิดระบบรับเงินในขณะนี้ กรุณาลองใหม่อีกครั้งภายหลัง
      </p>
    </div>
  );
};

export default DonorOfflineCard;
