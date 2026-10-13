import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { fetchPublicStreamers } from "../../utils/api";

const StreamerList = () => {
  const [streamers, setStreamers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadStreamers = async () => {
      try {
        const data = await fetchPublicStreamers();
        if (isMounted && Array.isArray(data)) {
          setStreamers(data);
        }
      } catch {
        // Keep empty list on error
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadStreamers();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-6 md:px-10 py-16">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white text-xl md:text-2xl font-bold">
          ค้นพบ <span className="donix-gradient-text">STREAMER</span>
        </h2>
        <Link
          to="/discover"
          className="text-[#a78bfa] text-sm hover:text-[#c4b5fd] transition-colors"
        >
          ดูทั้งหมด
        </Link>
      </div>
      <p className="text-[#9ca3af] text-sm mb-8">Streamer ที่น่าสนใจ</p>

      {loading ? (
        <div className="grid sm:grid-cols-3 gap-6" data-testid="streamer-list-loading">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
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
      ) : streamers.length === 0 ? (
        <div className="rounded-2xl border border-[#374151] bg-[#13101c] p-8 text-center">
          <p className="text-sm text-[#9ca3af]">ยังไม่มีสตรีมเมอร์ในระบบขณะนี้</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-6">
          {streamers.slice(0, 6).map((s) => {
            const displayName = s.nickname || s.username;
            return (
              <Link
                key={s.username}
                to={`/${encodeURIComponent(s.username)}/profile`}
                data-testid={`streamer-card-${s.username}`}
                className="group bg-[#13101c] border border-[#374151] rounded-2xl overflow-hidden
                           hover:border-[#7c3aed]/60 hover:-translate-y-1
                           hover:shadow-[0_0_28px_rgba(124,58,237,0.25)]
                           transition-all duration-300 block"
              >
                <div className="relative h-32 bg-gradient-to-br from-[#4c1d95]/50 to-[#7c3aed]/20 flex items-center justify-center overflow-hidden">
                  {s.isLive && (
                    <span className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 rounded-full bg-red-600/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </span>
                  )}

                  {s.avatar ? (
                    <img
                      src={s.avatar}
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
                      @{s.username}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[#a78bfa] shrink-0 group-hover:translate-x-0.5 transition-transform">
                    <span>ดูโปรไฟล์</span>
                    <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default StreamerList;
