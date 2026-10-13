import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchPublicStreamers } from "../../utils/api";
import StreamerProfileCard, {
  StreamerSkeletonLoader,
} from "../MainPage/StreamerProfileCard";

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
        <StreamerSkeletonLoader
          gridClassName="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          testId="featured-streamer-loading"
        />
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
          {streamers.map((s) => (
            <div
              key={s.username}
              className="w-full sm:w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)] shrink-0"
            >
              <StreamerProfileCard streamer={s} />
            </div>
          ))}
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
