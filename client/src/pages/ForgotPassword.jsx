import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/Auth/AuthLayout";
import InputField from "../components/Auth/InputField";
import PasswordChecklist from "../components/Auth/PasswordChecklist";
import { isPasswordValid, getPasswordError } from "../utils/passwordValidation";
import {
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetForgotPassword,
} from "../utils/api";
import { Mail, Phone, CheckCircle2, ArrowLeft, RefreshCw } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();

  // steps: 1 = Request OTP, 2 = Verify OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);
  const [channel, setChannel] = useState("email"); // "email" | "sms"
  const [identifier, setIdentifier] = useState("");
  const [target, setTarget] = useState("");
  const [maskedTarget, setMaskedTarget] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      return setError(channel === "email" ? "กรุณากรอกอีเมลของคุณ" : "กรุณากรอกเบอร์โทรศัพท์ของคุณ");
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const data = await sendForgotPasswordOtp({
        identifier: identifier.trim(),
        channel,
      });

      setTarget(data.target || identifier.trim());
      setMaskedTarget(data.maskedTarget || data.target || identifier.trim());
      setStep(2);
      setCountdown(60);
      setSuccessMsg(`ส่งรหัส OTP ไปยัง ${data.maskedTarget || "อุปกรณ์ของคุณ"} แล้ว`);
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการส่งรหัส OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      return setError("กรุณากรอกรหัส OTP ให้ครบ 6 หลัก");
    }

    setLoading(true);
    setError("");

    try {
      const data = await verifyForgotPasswordOtp({
        target,
        otp: otp.trim(),
      });

      if (!data?.resetToken) {
        throw new Error("ไม่พบโทเค็นสำหรับรีเซ็ตรหัสผ่าน");
      }

      setResetToken(data.resetToken);
      setStep(3);
      setError("");
    } catch (err) {
      setError(err.message || "รหัส OTP ไม่ถูกต้องหรือหมดอายุ");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid(newPassword)) {
      return setError(getPasswordError(newPassword));
    }

    if (newPassword !== confirmPassword) {
      return setError("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
    }

    setLoading(true);

    try {
      await resetForgotPassword({
        resetToken,
        newPassword,
      });

      setStep(4);
    } catch (err) {
      setError(err.message || "ไม่สามารถรีเซ็ตรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-300 transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          <span>กลับไปหน้าเข้าสู่ระบบ</span>
        </Link>
        <h2 className="text-2xl font-bold text-white tracking-wide">
          {step === 4 ? "รีเซ็ตรหัสผ่านสำเร็จ" : "ลืมรหัสผ่าน"}
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          {step === 1 && "เลือกช่องทางที่ต้องการรับรหัส OTP เพื่อยืนยันตัวตน"}
          {step === 2 && `กรอกรหัสยืนยัน 6 หลักที่ส่งไปยัง ${maskedTarget}`}
          {step === 3 && "กำหนดรหัสผ่านใหม่สำหรับเข้าใช้งานบัญชีของคุณ"}
          {step === 4 && "รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว เข้าสู่ระบบได้ทันที"}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {successMsg && step === 2 && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STEP 1: Request OTP */}
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          {/* Channel selector */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/8 mb-4">
            <button
              type="button"
              onClick={() => {
                setChannel("email");
                setError("");
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                channel === "email"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Mail size={14} />
              <span>ส่งไปที่อีเมล</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setChannel("sms");
                setError("");
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                channel === "sms"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Phone size={14} />
              <span>ส่งผ่าน SMS</span>
            </button>
          </div>

          <InputField
            name="identifier"
            label={channel === "email" ? "อีเมลที่ลงทะเบียนไว้" : "เบอร์โทรศัพท์ที่ลงทะเบียนไว้"}
            type={channel === "email" ? "email" : "text"}
            placeholder={channel === "email" ? "your-email@example.com" : "0812345678"}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(147,51,234,0.35)] disabled:opacity-50"
          >
            {loading ? "กำลังส่งรหัส OTP..." : "ส่งรหัส OTP"}
          </button>
        </form>
      )}

      {/* STEP 2: Verify OTP */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="otp-input" className="text-xs font-semibold text-[#d4cfdf]">
              รหัส OTP (6 หลัก)
            </label>
            <input
              id="otp-input"
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="123456"
              className="w-full rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-3 text-center text-2xl font-bold tracking-[8px] text-purple-300 placeholder-[#5c556f] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all font-mono"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>
              {countdown > 0 ? (
                `ขอรหัสใหม่ได้ใน ${countdown} วินาที`
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp(null)}
                  disabled={loading}
                  className="text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  <span>ส่งรหัสใหม่อีกครั้ง</span>
                </button>
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp("");
                setError("");
              }}
              className="text-gray-500 hover:text-gray-300"
            >
              เปลี่ยนช่องทาง
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full mt-2 py-3 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(147,51,234,0.35)] disabled:opacity-50"
          >
            {loading ? "กำลังตรวจสอบ..." : "ยืนยันรหัส OTP"}
          </button>
        </form>
      )}

      {/* STEP 3: Reset Password */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <InputField
            name="newPassword"
            label="รหัสผ่านใหม่"
            type="password"
            placeholder="*************"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <PasswordChecklist password={newPassword} />

          <InputField
            name="confirmPassword"
            label="ยืนยันรหัสผ่านใหม่"
            type="password"
            placeholder="*************"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(147,51,234,0.35)] disabled:opacity-50"
          >
            {loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
          </button>
        </form>
      )}

      {/* STEP 4: Success */}
      {step === 4 && (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 mx-auto grid place-items-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
            <CheckCircle2 size={36} />
          </div>
          <p className="text-sm text-gray-300">
            คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full py-3 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(147,51,234,0.35)]"
          >
            ไปที่หน้าเข้าสู่ระบบ
          </button>
        </div>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
