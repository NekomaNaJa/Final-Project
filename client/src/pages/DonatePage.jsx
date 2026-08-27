import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "../components/Sidebar";
import DashboardTopbar from "../components/Topbar";
import Footer from "../components/MainPage/Footer";
import DonatePageLink from "../components/DonatePage/DonatePageLink";
import DecorateSection from "../components/DonatePage/DecorateSection";
import MessageFilterSection from "../components/DonatePage/MessageFilterSection";
import SocialMediaSection from "../components/DonatePage/SocialMediaSection";

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

const DonatePage = () => {
  const navigate = useNavigate();
  const user = getUserFromToken();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#090812] font-sans text-white lg:flex">
      {/* Sidebar */}
      <DashboardSidebar onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Topbar with breadcrumb */}
          <DashboardTopbar username={user?.username} breadcrumb="หน้ารับเงิน" />

          {/* Page Content */}
          <main className="mx-auto w-full max-w-[960px] px-4 py-8 sm:px-6 lg:px-8 space-y-6">
            <DonatePageLink username={user?.username || "Test"} />
            <DecorateSection />
            <MessageFilterSection />
            <SocialMediaSection />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DonatePage;
