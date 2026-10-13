import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export const StreamerSkeletonLoader = ({
  count = 3,
  gridClassName = "grid sm:grid-cols-3 gap-6",
  testId = "streamer-loading",
}) => (
  <div className={gridClassName} data-testid={testId}>
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        className="bg-[#13101c] border border-[#374151] rounded-2xl overflow-hidden animate-pulse"
      >
        <div className="h-32 bg-[#1f1930]" />
        <div className="p-4 space-y-2">
          <div className="h-4 w-28 rounded bg-[#2a2240]" />
          <div className="h-3 w-20 rounded bg-[#1f1930]" />
        </div>
      </div>
    ))}
  </div>
);

const StreamerProfileCard = ({ streamer }) => {
  const displayName = streamer?.nickname || streamer?.username || "";
  const username = streamer?.username || "";

  return (
    <Link
      to={`/${encodeURIComponent(username)}/profile`}
      data-testid={`streamer-card-${username}`}
      className="group bg-[#13101c] border border-[#374151] rounded-2xl overflow-hidden
                 hover:border-[#7c3aed]/60 hover:-translate-y-1
                 hover:shadow-[0_0_28px_rgba(124,58,237,0.25)]
                 transition-all duration-300 block"
    >
      <div className="relative h-32 bg-gradient-to-br from-[#4c1d95]/50 to-[#7c3aed]/20 flex items-center justify-center overflow-hidden">
        {streamer?.isLive && (
          <span className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 rounded-full bg-red-600/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            <span>LIVE</span>
          </span>
        )}

        {streamer?.avatar ? (
          <img
            src={streamer.avatar}
            alt={displayName}
            className="h-20 w-20 rounded-full object-cover border-2 border-purple-400/70 shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-purple-400/70 bg-[#1b1630] text-2xl font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:scale-105 transition-transform duration-300">
            {displayName?.[0]?.toUpperCase() || "S"}
          </div>
        )}
      </div>

      <div className="p-4 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate group-hover:text-[#c4b5fd] transition-colors">
            {displayName}
          </p>
          <p className="text-[#6b7280] text-xs mt-0.5 truncate">
            @{username}
          </p>
        </div>
        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[#a78bfa] shrink-0 group-hover:translate-x-0.5 transition-transform">
          <span>ดูโปรไฟล์</span>
          <ChevronRight size={14} />
        </span>
      </div>
    </Link>
  );
};

export default StreamerProfileCard;
