import React from "react";
import { Sparkles } from "lucide-react";

const ComingSoonCard = () => {
  return (
    <div className="rounded-2xl border border-[#2b2542]/60 bg-[#141026]/40 backdrop-blur-md p-8 sm:p-10 flex flex-col items-center justify-center text-center shadow-lg min-h-[190px] transition-all hover:border-purple-500/30 group">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-tr from-[#9333ea] to-[#7c3aed] text-white shadow-[0_0_24px_rgba(147,51,234,0.4)] group-hover:scale-105 transition-transform">
        <Sparkles size={26} />
      </div>
      <h3 className="text-base font-semibold text-gray-200 mt-4 tracking-wide">
        ช่องทางใหม่กำลังจะมา
      </h3>
      <p className="text-xs font-bold text-[#80779b] tracking-[0.22em] mt-1 uppercase">
        COMING SOON
      </p>
    </div>
  );
};

export default ComingSoonCard;
