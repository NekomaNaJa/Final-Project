import React from "react";
import { Link } from "react-router-dom";
import NotificationBell from "./NotificationBell";

const getDecodedUsername = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replaceAll("-", "+").replaceAll("_", "/");
    return JSON.parse(atob(base64))?.username || null;
  } catch {
    return null;
  }
};

const DashboardNavbar = ({ username, avatar, breadcrumb }) => {
  const effectiveUsername = username || getDecodedUsername() || "";

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-[#0A0B12]/85 px-8 py-4 backdrop-blur-xl">
      <nav className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gray-500">
        <Link to="/" className="hover:text-purple-400 transition-colors">
          หน้าหลัก
        </Link>
        <span>/</span>
        {breadcrumb ? (
          <span className="text-white">{breadcrumb}</span>
        ) : (
          <span className="text-white">ข้อมูลเบื้องต้น</span>
        )}
      </nav>

      <div className="flex items-center gap-3">
        <NotificationBell username={effectiveUsername} />
        <div className="flex items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1.5">
          <div className="w-7 h-7 grid place-items-center rounded-full bg-linear-to-br from-purple-500 to-purple-700 text-xs font-bold text-white overflow-hidden">
            {avatar ? (
              <img src={avatar} alt={effectiveUsername || "User"} className="h-full w-full object-cover" />
            ) : (
              effectiveUsername?.[0]?.toUpperCase() || "T"
            )}
          </div>
          <span className="text-sm font-medium text-white">
            {effectiveUsername || "Test"}
          </span>
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
