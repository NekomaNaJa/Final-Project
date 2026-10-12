import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SettingsCard from "../DonatePage/SettingsCard";
import { Mail, KeyRound, ShieldCheck, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";
import { sendForgotPasswordOtp, verifyForgotPasswordOtp } from "../../utils/api";

const SecurityTab = ({ user, onSave, navigate: navigateProp }) => {
  const routerNavigate = useNavigate();
  const navigate = navigateProp || routerNavigate;
  const [email, setEmail] = useState(user?.email || "");
  const [otp, setOtp] = useState("");
  const [target, setTarget] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError("กรุณากรอกอีเมลสำหรับรับรหัส OTP");
      return;
    }

    setSendingOtp(true);
    setError("");
    setSuccessMsg("");

    try {
      const data = await sendForgotPasswordOtp({
        identifier: email.trim(),
        channel: "email",
      });

      setTarget(data?.target || email.trim());
      setOtpSent(true);
      setCountdown(60);
      if (data?.demoOtp) {
        setOtp(String(data.demoOtp));
        setSuccessMsg(`ส่งรหัส OTP ไปยัง ${data?.maskedTarget || email.trim()} เรียบร้อยแล้ว (รหัส OTP: ${data.demoOtp})`);
      } else {
        setSuccessMsg(`ส่งรหัส OTP ไปยัง ${data?.maskedTarget || email.trim()} เรียบร้อยแล้ว`);
      }
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการส่งรหัส OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!email.trim()) {
      setError("กรุณากรอกอีเมลสำหรับรับรหัส OTP");
      return;
    }
    if (!otpSent) {
      setError("กรุณากดส่งรหัส OTP ก่อน");
      return;
    }
    if (!otp.trim() || otp.trim().length !== 6) {
      setError("กรุณากรอกรหัส OTP ให้ครบ 6 หลัก");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const data = await verifyForgotPasswordOtp({
        target: target || email.trim(),
        otp: otp.trim(),
      });

      if (!data?.resetToken) {
        throw new Error("ไม่พบโทเค็นสำหรับรีเซ็ตรหัสผ่าน");
      }

      if (onSave) {
        onSave({ email: email.trim(), resetToken: data.resetToken });
      }

      navigate("/forgot-password", {
        state: {
          step: 3,
          resetToken: data.resetToken,
          target: target || email.trim(),
          identifier: email.trim(),
        },
      });
    } catch (err) {
      setError(err.message || "รหัส OTP ไม่ถูกต้องหรือหมดอายุ");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SettingsCard
      title="ความปลอดภัย"
      subtitle="SECURITY"
      onSave={handleVerifyOtp}
      saveText={verifying ? "กำลังตรวจสอบ..." : "ยืนยันและเปลี่ยนรหัสผ่าน"}
    >
      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {successMsg && (
        <div role="status" className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4">
          {/* Email Input with Send OTP Button */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="security-email" className="text-xs font-semibold text-[#d4cfdf]">
              อีเมลสำหรับรับรหัส OTP
            </label>
            <div className="relative flex items-center rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-2 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/30 transition-all">
              <Mail size={15} className="mr-2.5 shrink-0 text-[#6e6682]" />
              <input
                id="security-email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="example@mail.com"
                className="w-full bg-transparent text-xs text-white placeholder-[#5c556f] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || countdown > 0}
                className="ml-2 shrink-0 rounded-lg bg-purple-600/30 border border-purple-500/40 px-3 py-1.5 text-[11px] font-medium text-purple-200 hover:bg-purple-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                {sendingOtp ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>กำลังส่ง...</span>
                  </>
                ) : countdown > 0 ? (
                  <>
                    <RefreshCw size={12} />
                    <span>ส่งใหม่ใน ({countdown}s)</span>
                  </>
                ) : (
                  <span>{otpSent ? "ส่งรหัสอีกครั้ง" : "ส่งรหัส OTP"}</span>
                )}
              </button>
            </div>
            <p className="text-[11px] text-[#78718a]">
              กรอกอีเมลเพื่อรับรหัส OTP สำหรับยืนยันการขอเปลี่ยนรหัสผ่าน
            </p>
          </div>

          {/* OTP Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="security-otp" className="text-xs font-semibold text-[#d4cfdf]">
              รหัส OTP (6 หลัก)
            </label>
            <div className="relative flex items-center rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-2.5 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/30 transition-all">
              <KeyRound size={15} className="mr-2.5 shrink-0 text-[#6e6682]" />
              <input
                id="security-otp"
                type="text"
                name="otp"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                placeholder="123456"
                className="w-full bg-transparent text-xs text-white tracking-widest placeholder-[#5c556f] placeholder:tracking-normal focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2FA Box */}
        <div className="flex items-start justify-between gap-3 rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 h-fit">
          <div className="flex items-start gap-2.5">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-purple-300" />
            <div>
              <p className="text-xs font-semibold text-white">
                ยืนยันตัวตน 2 ขั้นตอน (2FA)
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-[#a89fc2]">
                เพิ่มความปลอดภัยให้บัญชีของคุณ
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={twoFactorEnabled}
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-medium transition-colors ${
              twoFactorEnabled
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-purple-600 text-white hover:bg-purple-500"
            }`}
          >
            {twoFactorEnabled ? "เปิดใช้งานแล้ว" : "เปิดใช้งาน"}
          </button>
        </div>
      </div>
    </SettingsCard>
  );
};

export default SecurityTab;