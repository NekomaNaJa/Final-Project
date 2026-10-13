import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchPublicStreamers } from "../../utils/api";

const FeaturedStreamers = ({ initialStreamers = null }) => {
  const [streamers, setStreamers] = useState(
    Array.isArray(initialStreamers) ? initialStreamers : []
  );
  const [loading, setLoading] = useState(!initialStreamers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const touchStartX = useRef(null);

  useEffect(() => {
    const updateItemsPerView = () => {
      if (typeof window !== "undefined") {
        if (window.innerWidth < 640) {
          setItemsPerView(1);
        } else if (window.innerWidth < 1024) {
          setItemsPerView(2);
        } else {
          setItemsPerView(3);
        }
      }
    };
    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  useEffect(() => {
    if (initialStreamers) return;

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

    void loadStreamers();
    return () => {
      isMounted = false;
    };
  }, [initialStreamers]);

  const maxIndex = Math.max(0, streamers.length - itemsPerView);
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < maxIndex;

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 50 && canPrev) {
      handlePrev();
    } else if (deltaX < -50 && canNext) {
      handleNext();
    }
    touchStartX.current = null;
  };

  const getTransform = () => {
    if (itemsPerView === 1) {
      return `translateX(calc(-${currentIndex} * (100% + 24px)))`;
    }
    if (itemsPerView === 2) {
      return `translateX(calc(-${currentIndex} * ((100% - 24px) / 2 + 24px)))`;
    }
    return `translateX(calc(-${currentIndex} * ((100% - 48px) / 3 + 24px)))`;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          data-testid="featured-streamer-loading"
        >
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
      );
    }

    if (streamers.length === 0) {
      return (
        <div className="rounded-2xl border border-[#374151] bg-[#13101c] p-8 text-center">
          <p className="text-sm text-[#9ca3af]">ยังไม่มีสตรีมเมอร์ในระบบขณะนี้</p>
        </div>
      );
    }

    return (
      <div
        className="relative overflow-hidden w-full select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          data-testid="carousel-track"
          className="flex transition-transform duration-500 ease-out gap-6"
          style={{ transform: getTransform() }}
        >
          {streamers.map((s) => {
            const displayName = s.nickname || s.username;
            return (
              <div
                key={s.username}
                className="w-full sm:w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)] shrink-0"
              >
                <Link
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
                        <span>LIVE</span>
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
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section className="mb-12" aria-label="สตรีมเมอร์แนะนำ">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
            <Star size={14} className="text-white fill-white/20" />
          </span>
          <h2 className="text-white text-lg font-bold">สตรีมเมอร์แนะนำ</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Carousel Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!canPrev}
              aria-label="ก่อนหน้า"
              data-testid="carousel-prev-btn"
              className="grid h-8 w-8 place-items-center rounded-full border border-[#374151] bg-[#13101c] text-gray-300 hover:border-purple-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canNext}
              aria-label="ถัดไป"
              data-testid="carousel-next-btn"
              className="grid h-8 w-8 place-items-center rounded-full border border-[#374151] bg-[#13101c] text-gray-300 hover:border-purple-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <Link
            to="/discover"
            className="text-[#a78bfa] text-xs hover:text-[#c4b5fd] transition-colors ml-1 hidden sm:inline-block"
          >
            ดูทั้งหมด
          </Link>
        </div>
      </div>

      <p className="text-[#9ca3af] text-xs mb-4 ml-9">
        Streamer แนะนำประจำสัปดาห์
      </p>

      {renderContent()}
    </section>
  );
};

export default FeaturedStreamers;
