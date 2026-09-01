import React from "react";
import DonixLogo from "../../assets/PrimaryLogo.png";
import DefaultHeroBanner from "../../assets/hero.png";

const DonorHeader = ({
  username = "Test",
  isOnline = true,
  welcomeMessage = "ข้อความต้อนรับ....",
  coverImage = null,
}) => {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Logo */}
      <div className="py-5 flex justify-center">
        <img src={DonixLogo} alt="DONIX" className="h-7 sm:h-8 w-auto" />
      </div>

      {/* Main Cover Banner Card */}
      <div className="w-full rounded-2xl overflow-hidden border border-[#2b2542] bg-[#16122a]/80 shadow-2xl relative">
        {/* Cover Banner Image */}
        <div className="w-full h-48 sm:h-56 relative overflow-hidden bg-[#0e0b1d]">
          <img
            src={coverImage || DefaultHeroBanner}
            alt="Cover Banner"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#16122a] via-transparent to-transparent opacity-90" />
        </div>

        {/* Streamer Avatar & Name */}
        <div className="px-6 sm:px-8 pb-7 pt-2 flex flex-col items-center text-center relative">
          {/* Avatar Container */}
          <div className="relative -mt-20 sm:-mt-22 mb-3">
            <div
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#1e1738] flex items-center justify-center text-3xl sm:text-4xl font-extrabold text-white shadow-2xl transition-all ${
                isOnline
                  ? "ring-4 ring-red-500 shadow-[0_0_28px_rgba(239,68,68,0.7)]"
                  : "ring-2 ring-gray-600"
              }`}
            >
              {username?.[0]?.toUpperCase() || "T"}
            </div>

            {/* Status Badge */}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 shrink-0">
              {isOnline ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-lg uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-[#374151] text-gray-300">
                  ออฟไลน์
                </span>
              )}
            </div>
          </div>

          {/* Streamer Name & Link */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide mt-2">
            {username}
          </h1>
          <p className="text-xs sm:text-sm text-[#8e87a2] mt-1">
            donix.app/{username}
          </p>

          {/* Welcome Message (shown when online) */}
          {isOnline && welcomeMessage && (
            <div className="mt-5 w-full pt-4 border-t border-[#2e2648]/60 text-center">
              <p className="text-sm sm:text-base text-gray-200 font-medium leading-relaxed">
                {welcomeMessage}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonorHeader;
