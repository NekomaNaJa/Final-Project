import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "../components/Sidebar";
import DashboardTopbar from "../components/Topbar";
import DonatePageLink from "../components/DonatePage/DonatePageLink";
import DecorateSection from "../components/DonatePage/DecorateSection";
import MessageFilterSection from "../components/DonatePage/MessageFilterSection";
import SocialMediaSection from "../components/DonatePage/SocialMediaSection";
import { clearToken, getTokenPayload } from "../utils/auth";
import AmbientBackground from "../components/shared/AmbientBackground";

const DonatePage = () => {
  const navigate = useNavigate();
  const user = getTokenPayload();

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <div className="relative min-h-screen bg-[#090812] font-sans text-white lg:flex">
      <AmbientBackground />

      {/* Sidebar */}
      <DashboardSidebar onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-between">
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
