import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import DonatePageLink from "../components/DonatePage/DonatePageLink";
import DecorateSection from "../components/DonatePage/DecorateSection";
import MessageFilterSection from "../components/DonatePage/MessageFilterSection";
import SocialMediaSection from "../components/DonatePage/SocialMediaSection";
import {
  fetchCurrentUser,
  updateDonationPageSettings,
  updateCurrentUser,
} from "../utils/api";
import { safeGetItem, safeSetItem } from "../utils/sanitizeStorage";

const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replaceAll("-", "+").replaceAll("_", "/")));
  } catch {
    localStorage.removeItem("token");
    return null;
  }
};

const DonatePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUserFromToken);
  const [feedback, setFeedback] = useState(null);
  const [donationConfig, setDonationConfig] = useState(() =>
    safeGetItem("donix_donate_config", {})
  );
  const [socialConfig, setSocialConfig] = useState({});

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const loadDonateData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const data = await fetchCurrentUser();
      if (data) {
        setUser((prev) => ({ ...prev, ...data }));
        if (data.donationPage) {
          setDonationConfig(data.donationPage);
          safeSetItem("donix_donate_config", data.donationPage);
        }
        if (data.social) {
          setSocialConfig(data.social);
        }
      }
    } catch (err) {
      if (
        err.message?.includes("ไม่ได้รับอนุญาต") ||
        err.message?.includes("หมดอายุ")
      ) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  }, [navigate]);

  useEffect(() => {
    const u = getUserFromToken();
    if (!u) {
      navigate("/login");
      return;
    }
    setUser((prev) => ({ ...prev, ...u }));
    loadDonateData();
  }, [navigate, loadDonateData]);

  const triggerFeedback = (type, message) => {
    setFeedback({ type, message });
    if (type === "success") {
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleSaveDonationSettings = async (data, successMessage, defaultErrorMessage) => {
    try {
      setFeedback(null);
      const resData = await updateDonationPageSettings(data);
      const current = safeGetItem("donix_donate_config", donationConfig);
      const updated = {
        ...current,
        ...(resData || {}),
        ...data,
      };

      setDonationConfig(updated);
      safeSetItem("donix_donate_config", updated);
      triggerFeedback("success", successMessage);
    } catch (err) {
      triggerFeedback("error", err.message || defaultErrorMessage);
    }
  };

  const handleSaveDecorate = (data) =>
    handleSaveDonationSettings(
      data,
      "บันทึกข้อมูลตกแต่งหน้ารับเงินสำเร็จ",
      "เกิดข้อผิดพลาดในการบันทึกข้อมูลตกแต่งหน้ารับเงิน"
    );

  const handleSaveFilter = (data) =>
    handleSaveDonationSettings(
      data,
      "บันทึกตัวกรองข้อความสำเร็จ",
      "เกิดข้อผิดพลาดในการบันทึกตัวกรองข้อความ"
    );

  const handleSaveSocial = async (data) => {
    try {
      setFeedback(null);
      const resData = await updateCurrentUser({ social: data });
      const updated = resData?.social || data;

      setSocialConfig(updated);
      triggerFeedback("success", "บันทึกโซเชียลมีเดียสำเร็จ");
    } catch (err) {
      triggerFeedback(
        "error",
        err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลโซเชียลมีเดีย"
      );
    }
  };

  return (
    <div className="relative min-h-screen bg-[#090812] font-sans text-white lg:flex">
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

            {/* Feedback Notification Banner */}
            {feedback && (
              <div
                role="status"
                className={`flex items-center gap-2.5 rounded-xl border p-4 text-xs font-medium transition-all ${
                  feedback.type === "success"
                    ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
                    : "border-red-500/30 bg-red-950/40 text-red-300"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle size={16} className="shrink-0 text-red-400" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <DecorateSection
              initialData={donationConfig}
              onSave={handleSaveDecorate}
            />
            <MessageFilterSection
              initialData={donationConfig}
              onSave={handleSaveFilter}
            />
            <SocialMediaSection
              initialData={socialConfig}
              onSave={handleSaveSocial}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DonatePage;
