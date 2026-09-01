import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
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
    <div className="relative min-h-screen bg-[#090812] font-sans text-white lg:flex overflow-x-hidden">
      {/* Ambient Gradient Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Top-center primary purple glow */}
        <div
          className="absolute -top-40 left-1/2 h-[650px] w-[950px] -translate-x-1/2 rounded-full blur-[110px] opacity-75"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(124, 58, 237, 0.28) 0%, rgba(88, 28, 135, 0.15) 45%, rgba(9, 8, 18, 0) 75%)",
          }}
        />
        {/* Upper-left accent glow */}
        <div
          className="absolute top-1/4 -left-24 h-[500px] w-[500px] rounded-full blur-[120px] opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(109, 40, 217, 0.2) 0%, rgba(9, 8, 18, 0) 70%)",
          }}
        />
        {/* Lower-right ambient glow */}
        <div
          className="absolute top-2/3 -right-24 h-[550px] w-[550px] rounded-full blur-[130px] opacity-35"
          style={{
            background:
              "radial-gradient(circle, rgba(147, 51, 234, 0.18) 0%, rgba(9, 8, 18, 0) 70%)",
          }}
        />
      </div>

      {/* Sidebar */}
      <div className="relative z-20 shrink-0">
        <Sidebar onLogout={handleLogout} />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Topbar with breadcrumb */}
          <Topbar username={user?.username} breadcrumb="หน้ารับเงิน" />

          {/* Page Content */}
          <main className="mx-auto w-full max-w-[960px] px-4 py-8 sm:px-6 lg:px-8 space-y-6">
            <DonatePageLink username={user?.username || "Test"} />
            <DecorateSection />
            <MessageFilterSection />
            <SocialMediaSection />
          </main>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default DonatePage;
