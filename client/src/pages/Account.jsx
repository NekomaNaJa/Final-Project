import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "../components/Sidebar";
import DashboardTopbar from "../components/Topbar";
import AccountProfileCard from "../components/Account/AccountProfileCard";
import ManageAccountCard from "../components/Account/ManageAccountCard";
import AccountTabs from "../components/Account/AccountTabs";

const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    localStorage.removeItem("token");
    return null;
  }
};

const Account = () => {
  const navigate = useNavigate();
  const user = getUserFromToken();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="relative min-h-screen bg-[#090812] font-sans text-white lg:flex">
      {/* Ambient Gradient Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[650px] w-[950px] -translate-x-1/2 rounded-full blur-[110px] opacity-75"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(124, 58, 237, 0.28) 0%, rgba(88, 28, 135, 0.15) 45%, rgba(9, 8, 18, 0) 75%)",
          }}
        />
        <div
          className="absolute top-1/4 -left-24 h-[500px] w-[500px] rounded-full blur-[120px] opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(109, 40, 217, 0.2) 0%, rgba(9, 8, 18, 0) 70%)",
          }}
        />
        <div
          className="absolute top-2/3 -right-24 h-[550px] w-[550px] rounded-full blur-[130px] opacity-35"
          style={{
            background:
              "radial-gradient(circle, rgba(147, 51, 234, 0.18) 0%, rgba(9, 8, 18, 0) 70%)",
          }}
        />
      </div>

      {/* Sidebar */}
      <DashboardSidebar onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Topbar with breadcrumb */}
          <DashboardTopbar username={user?.username} breadcrumb="บัญชีผู้ใช้" />

          <main className="mx-auto w-full max-w-[1120px] px-5 py-8 lg:px-8 space-y-6">
            {/* Header */}
            <div>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#8066d6]">
                My Account
              </p>
              <h1 className="text-2xl font-bold text-[#e8e4ee]">
                สวัสดี{" "}
                <span className="font-serif tracking-wide text-[#aa8df1]">
                  {user?.username || "Streamer"}
                </span>{" "}
                วันนี้อยากทำอะไร
              </h1>
              <p className="mt-1 text-xs text-[#716b7a]">
                จัดการข้อมูลส่วนตัว ยืนยันตัวตน และเชื่อมต่อโซเชียล
              </p>
            </div>

            {/* Profile Overview */}
            <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
              <AccountProfileCard user={user} />
              <ManageAccountCard />
            </div>

            {/* Tabs */}
            <AccountTabs user={user} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Account;
