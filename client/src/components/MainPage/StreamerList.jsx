import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchPublicStreamers } from "../../utils/api";
import StreamerProfileCard, {
  StreamerSkeletonLoader,
} from "./StreamerProfileCard";

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
    void loadStreamers();
    return () => {
      isMounted = false;
    };
  }, []);

  const renderStreamersContent = () => {
    if (loading) {
      return <StreamerSkeletonLoader testId="streamer-list-loading" />;
    }

    if (streamers.length === 0) {
      return (
        <div className="rounded-2xl border border-[#374151] bg-[#13101c] p-8 text-center">
          <p className="text-sm text-[#9ca3af]">ยังไม่มีสตรีมเมอร์ในระบบขณะนี้</p>
        </div>
      );
    }

    return (
      <div className="grid sm:grid-cols-3 gap-6">
        {streamers.slice(0, 6).map((s) => (
          <StreamerProfileCard key={s.username} streamer={s} />
        ))}
      </div>
    );
  };

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

      {renderStreamersContent()}
    </section>
  );
};

export default StreamerList;
