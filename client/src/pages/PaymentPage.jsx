import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import PaymentHeader from "../components/Payment/PaymentHeader";
import PromptPayCard from "../components/Payment/PromptPayCard";
import TrueMoneyCard from "../components/Payment/TrueMoneyCard";
import BankCard from "../components/Payment/BankCard";
import ComingSoonCard from "../components/Payment/ComingSoonCard";

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

const PaymentPage = () => {
  const navigate = useNavigate();
  const user = getUserFromToken();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSavePromptPay = (data) => {
    console.log("Saving PromptPay settings:", data);
  };

  const handleSaveTrueMoney = (data) => {
    console.log("Saving TrueMoney settings:", data);
  };

  const handleSaveBank = (data) => {
    console.log("Saving Bank settings:", data);
  };

  return (
    <div className="relative min-h-screen bg-[#090812] font-sans text-white lg:flex">
      {/* Ambient Gradient Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Top-center primary purple glow */}
        <div
          className="absolute -top-40 left-1/2 h-[750px] w-[1100px] -translate-x-1/2 rounded-full blur-[120px] opacity-80"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(124, 58, 237, 0.3) 0%, rgba(88, 28, 135, 0.16) 45%, rgba(9, 8, 18, 0) 75%)",
          }}
        />
        {/* Upper-left accent glow */}
        <div
          className="absolute top-1/4 -left-24 h-[550px] w-[550px] rounded-full blur-[130px] opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(109, 40, 217, 0.22) 0%, rgba(9, 8, 18, 0) 70%)",
          }}
        />
        {/* Lower-right ambient glow */}
        <div
          className="absolute top-2/3 -right-24 h-[600px] w-[600px] rounded-full blur-[140px] opacity-35"
          style={{
            background:
              "radial-gradient(circle, rgba(147, 51, 234, 0.2) 0%, rgba(9, 8, 18, 0) 70%)",
          }}
        />
      </div>

      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col pb-16">
        {/* Topbar with breadcrumb */}
        <Topbar username={user?.username} breadcrumb="บัญชีรับเงิน" />

        {/* Page Content */}
        <main className="mx-auto w-full max-w-[1240px] px-6 sm:px-10 lg:px-14 py-10 space-y-8">
          <PaymentHeader />

          {/* 2x2 Grid of Payment Channels */}
          <div className="grid gap-6 lg:gap-8 md:grid-cols-2">
            <PromptPayCard onSave={handleSavePromptPay} />
            <TrueMoneyCard onSave={handleSaveTrueMoney} />
            <BankCard onSave={handleSaveBank} />
            <ComingSoonCard />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PaymentPage;
