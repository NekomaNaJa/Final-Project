import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AccountProfileCard from "../components/Account/AccountProfileCard";
import ManageAccountCard from "../components/Account/ManageAccountCard";
import AccountTabs from "../components/Account/AccountTabs";
import { clearToken, getToken, getTokenPayload } from "../utils/auth";
import { API, parseResponse } from "../utils/api";
import AmbientBackground from "../components/shared/AmbientBackground";

const Account = () => {
  const navigate = useNavigate();
  const tokenPayload = getTokenPayload();
  const [profile, setProfile] = useState(tokenPayload);

  // ดึงข้อมูลผู้ใช้จริงจาก server (createdAt, email, phone ฯลฯ ที่ไม่ได้อยู่ใน JWT)
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let cancelled = false;

    fetch(API.me, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(parseResponse)
      .then((data) => {
        if (!cancelled && data?.user) setProfile(data.user);
      })
      .catch((err) => {
        if (cancelled) return;
        // 401 = token ใช้ไม่ได้แล้ว ให้ล้าง token และกลับไปหน้าเข้าสู่ระบบ
        if (/หมดอายุ|เข้าสู่ระบบ/.test(err.message)) {
          clearToken();
          navigate("/login");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <div className="relative min-h-screen bg-[#090812] font-sans text-white lg:flex">
      <AmbientBackground />

      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Topbar with breadcrumb */}
          <Topbar username={profile?.username} breadcrumb="บัญชีผู้ใช้" />

          <main className="mx-auto w-full max-w-[1120px] px-5 py-8 lg:px-8 space-y-6">
            {/* Header */}
            <div>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#8066d6]">
                My Account
              </p>
              <h1 className="text-2xl font-bold text-[#e8e4ee]">
                สวัสดี{" "}
                <span className="font-serif tracking-wide text-[#aa8df1]">
                  {profile?.username || "Streamer"}
                </span>{" "}
                วันนี้อยากทำอะไร
              </h1>
              <p className="mt-1 text-xs text-[#716b7a]">
                จัดการข้อมูลส่วนตัว ยืนยันตัวตน และเชื่อมต่อโซเชียล
              </p>
            </div>

            {/* Profile Overview */}
            <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
              <AccountProfileCard user={profile} />
              <ManageAccountCard user={profile} />
            </div>

            {/* Tabs */}
            <AccountTabs user={profile} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Account;
