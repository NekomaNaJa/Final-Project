import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Heart, Loader2, UserX } from "lucide-react";
import Navbar from "../components/MainPage/Navbar";
import Footer from "../components/MainPage/Footer";
import AccountProfileCard from "../components/Account/AccountProfileCard";
import SocialMediaTab from "../components/Account/SocialMediaTab";
import { fetchPublicStreamer } from "../utils/api";

const PublicProfilePage = () => {
  const { username: paramUsername } = useParams();
  const username = paramUsername || "Streamer";

  const [streamer, setStreamer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        const data = await fetchPublicStreamer(username);
        if (isMounted) {
          if (data) {
            setStreamer(data);
          } else {
            setNotFound(true);
          }
        }
      } catch {
        if (isMounted) {
          setNotFound(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [username]);

  const displayName = streamer?.nickname || streamer?.username || username;

  return (
    <div className="relative min-h-screen bg-[#090812] font-sans text-white flex flex-col justify-between">
      {/* Ambient Gradient Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[650px] w-[950px] -translate-x-1/2 rounded-full blur-[110px] opacity-75"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(124, 58, 237, 0.28) 0%, rgba(88, 28, 135, 0.15) 45%, rgba(9, 8, 18, 0) 75%)",
          }}
        />
      </div>

      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto w-full max-w-[1120px] px-5 py-8 lg:px-8 space-y-6">
          {/* Top Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9891ab] hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              <span>กลับหน้าหลัก</span>
            </Link>

            {!notFound && streamer && (
              <Link
                to={`/${encodeURIComponent(streamer.username || username)}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#8b5cf6] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_16px_rgba(139,92,246,0.35)] hover:bg-[#7c3aed] transition-all"
              >
                <Heart size={13} />
                <span>สนับสนุนโดเนท</span>
              </Link>
            )}
          </div>

          {loading ? (
            <div
              data-testid="public-profile-loading"
              className="flex flex-col items-center justify-center rounded-2xl border border-[#2b2542] bg-[#16122a]/80 p-16 text-center"
            >
              <Loader2 size={32} className="text-purple-400 animate-spin mb-3" />
              <p className="text-xs text-[#9891ab]">กำลังโหลดข้อมูลโปรไฟล์...</p>
            </div>
          ) : notFound ? (
            <div
              data-testid="public-profile-not-found"
              className="flex flex-col items-center justify-center rounded-2xl border border-[#2b2542] bg-[#16122a]/80 p-16 text-center"
            >
              <UserX size={40} className="text-red-400 mb-3" />
              <h1 className="text-lg font-bold text-white">ไม่พบสตรีมเมอร์นี้</h1>
              <p className="mt-1 text-xs text-[#9891ab]">
                ไม่พบข้อมูลโปรไฟล์ของ @{username} ในระบบ
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#8066d6]">
                  Streamer Profile
                </p>
                <h1 className="text-2xl font-bold text-[#e8e4ee]">
                  โปรไฟล์ของ{" "}
                  <span className="font-serif tracking-wide text-[#aa8df1]">
                    {displayName}
                  </span>
                </h1>
                <p className="mt-1 text-xs text-[#716b7a]">
                  {streamer?.bio || "ข้อมูลโปรไฟล์และช่องทางโซเชียลมีเดียของสตรีมเมอร์"}
                </p>
              </div>

              {/* Read-Only Profile Overview (Only Profile Card, No ManageAccountCard) */}
              <div className="max-w-sm">
                <AccountProfileCard user={streamer} readOnly />
              </div>

              {/* Read-Only Social Media Section (User Info & Security tabs removed) */}
              <div className="space-y-4">
                <div className="inline-flex rounded-full border border-[#2b2542] bg-[#130f24] p-1">
                  <span className="rounded-full bg-[#8b5cf6] px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_14px_rgba(139,92,246,0.4)]">
                    โซเชียลมีเดีย
                  </span>
                </div>

                <SocialMediaTab user={streamer} readOnly />
              </div>
            </>
          )}
        </main>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default PublicProfilePage;
