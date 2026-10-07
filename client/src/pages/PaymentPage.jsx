import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import PaymentHeader from "../components/Payment/PaymentHeader";
import PromptPayCard from "../components/Payment/PromptPayCard";
import TrueMoneyCard from "../components/Payment/TrueMoneyCard";
import BankCard from "../components/Payment/BankCard";
import ComingSoonCard from "../components/Payment/ComingSoonCard";
import { fetchCurrentUser, updatePaymentSettings } from "../utils/api";
import { safeGetItem, safeSetItem, sanitizeValue } from "../utils/sanitizeStorage";

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

const PaymentPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getUserFromToken());
  const [feedback, setFeedback] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(() =>
    safeGetItem("donix_payment_config", {})
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const loadPaymentData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const data = await fetchCurrentUser();
      if (data) {
        setUser((prev) => ({ ...prev, ...data }));
        if (data.payment) {
          setPaymentConfig(data.payment);
          safeSetItem("donix_payment_config", data.payment);
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
    loadPaymentData();
  }, [loadPaymentData]);

  const handleSavePromptPay = async (data) => {
    try {
      setFeedback(null);
      const cleanPromptPay = {
        enabled: Boolean(data?.enabled),
        type: sanitizeValue(data?.type) || "เบอร์โทรศัพท์",
        number:
          typeof data?.number === "string"
            ? data.number.replace(/[^0-9]/g, "").trim()
            : "",
      };

      const resData = await updatePaymentSettings({ promptpay: cleanPromptPay });
      const current = safeGetItem("donix_payment_config", paymentConfig);
      const updated = {
        ...current,
        ...(resData || {}),
        promptpay: cleanPromptPay,
      };

      setPaymentConfig(updated);
      safeSetItem("donix_payment_config", updated);
      setFeedback({ type: "success", message: "บันทึกข้อมูลพร้อมเพย์สำเร็จ" });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลพร้อมเพย์",
      });
    }
  };

  const handleSaveTrueMoney = async (data) => {
    try {
      setFeedback(null);
      const cleanTrueMoney = {
        enabled: Boolean(data?.enabled),
        phone:
          typeof data?.phone === "string"
            ? data.phone.replace(/[^0-9]/g, "").trim()
            : "",
      };

      const resData = await updatePaymentSettings({ truemoney: cleanTrueMoney });
      const current = safeGetItem("donix_payment_config", paymentConfig);
      const updated = {
        ...current,
        ...(resData || {}),
        truemoney: cleanTrueMoney,
      };

      setPaymentConfig(updated);
      safeSetItem("donix_payment_config", updated);
      setFeedback({ type: "success", message: "บันทึกข้อมูลทรูมันนี่สำเร็จ" });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลทรูมันนี่",
      });
    }
  };

  const handleSaveBank = async (data) => {
    try {
      setFeedback(null);
      const cleanBank = {
        enabled: Boolean(data?.enabled),
        bankName: sanitizeValue(data?.bankName) || "",
        accountNumber:
          typeof data?.accountNumber === "string"
            ? data.accountNumber.replace(/[^0-9-]/g, "").trim()
            : "",
        accountName: sanitizeValue(data?.accountName) || "",
      };

      const resData = await updatePaymentSettings({ bank: cleanBank });
      const current = safeGetItem("donix_payment_config", paymentConfig);
      const updated = {
        ...current,
        ...(resData || {}),
        bank: cleanBank,
      };

      setPaymentConfig(updated);
      safeSetItem("donix_payment_config", updated);
      setFeedback({ type: "success", message: "บันทึกข้อมูลบัญชีธนาคารสำเร็จ" });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลบัญชีธนาคาร",
      });
    }
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

          {/* 2x2 Grid of Payment Channels */}
          <div className="grid gap-6 lg:gap-8 md:grid-cols-2">
            <PromptPayCard
              initialData={paymentConfig?.promptpay}
              onSave={handleSavePromptPay}
            />
            <TrueMoneyCard
              initialData={paymentConfig?.truemoney}
              onSave={handleSaveTrueMoney}
            />
            <BankCard
              initialData={paymentConfig?.bank}
              onSave={handleSaveBank}
            />
            <ComingSoonCard />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PaymentPage;
