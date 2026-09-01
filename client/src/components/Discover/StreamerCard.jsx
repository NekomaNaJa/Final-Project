import { ChevronRight } from "lucide-react";

const StreamerCard = ({
  name = "Name Streamer",
  game = "Style game",
  followers = "1.2k",
  live = false,
}) => {
  return (
    <div
      className="group bg-[#13101c] border border-[#374151] rounded-2xl overflow-hidden
                 hover:border-[#7c3aed]/60 hover:-translate-y-1
                 hover:shadow-[0_0_28px_rgba(124,58,237,0.25)]
                 transition-all duration-300 cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative h-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#4c1d95]/50 to-[#7c3aed]/20
                     group-hover:scale-110 transition-transform duration-500 ease-out"
        />

        {live && (
          <span className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[9px] font-bold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/55
                     opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <span className="flex items-center gap-1 text-xs font-semibold text-white">
            ดูโปรไฟล์
            <ChevronRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-white text-sm font-semibold group-hover:text-[#c4b5fd] transition-colors">
          {name}
        </p>
        <p className="text-[#6b7280] text-xs mt-0.5">{game}</p>

        <div className="mt-3 flex items-center justify-between border-t border-[#374151] pt-3">
          <span className="text-[10px] text-[#6b7280]">{followers} ผู้ติดตาม</span>
          <span
            className="flex items-center gap-0.5 text-[10px] font-medium text-[#a78bfa]
                       opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            VIEW PROFILE
            <ChevronRight size={11} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default StreamerCard;