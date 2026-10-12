import React, { useState, useEffect } from "react";
import { Pencil, Mail, Phone, X, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { sendLinkOtp, verifyLinkOtp } from "../../utils/api";

const DiscordIcon = (
  <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127c-.598.35-1.22.647-1.873.892a.076.076 0 0 0-.04.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.001-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.548-13.66a.06.06 0 0 0-.031-.028zM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.332-.955 2.418-2.157 2.418zm7.974 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.332-.946 2.418-2.157 2.418z" />
  </svg>
);

const StreamlabsIcon = (
  <svg className="w-4 h-4 text-[#80F5D2]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2 3 7v10l9 5 9-5V7l-9-5zm0 2.31 6.93 3.85L12 12.02 5.07 8.16 12 4.31zM5 9.7l6 3.34v6.66L5 16.3V9.7zm8 10v-6.66l6-3.34v6.6l-6 3.4z" />
  </svg>
);

const ManageAccountCard = ({ user, onUpdateUser }) => {
  const [modalType, setModalType] = useState(null); // "email" | "phone" | null
  const [inputValue, setInputValue] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [step, setStep] = useState(1); // 1 = Input & Send OTP, 2 = Verify OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const openModal = (type) => {
    setModalType(type);
    setInputValue(type === "email" ? (user?.email || "") : (user?.phone || ""));
    setOtpValue("");
    setStep(1);
    setError("");
    setSuccess("");
    setCountdown(0);
  };

  const closeModal = () => {
    setModalType(null);
    setOtpValue("");
    setError("");
    setSuccess("");
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) {
      setError(modalType === "email" ? "กรุณากรอกอีเมล" : "กรุณากรอกเบอร์โทรศัพท์");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await sendLinkOtp({
        target: inputValue.trim(),
        type: modalType,
      });

      setStep(2);
      setCountdown(60);
      setSuccess(`ส่งรหัส OTP ไปยัง ${inputValue.trim()} แล้ว`);
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการส่งรหัส OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpValue.trim() || otpValue.trim().length !== 6) {
      setError("กรุณากรอกรหัส OTP ให้ครบ 6 หลัก");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const updatedUser = await verifyLinkOtp({
        target: inputValue.trim(),
        type: modalType,
        otp: otpValue.trim(),
      });

      onUpdateUser?.(updatedUser);
      setSuccess("เชื่อมต่อและยืนยันสำเร็จแล้ว");
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      setError(err.message || "รหัส OTP ไม่ถูกต้องหรือหมดอายุ");
    } finally {
      setLoading(false);
    }
  };

  const renderConnectionAction = (row) => {
    if (row.connected) {
      return <>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400">ยืนยันแล้ว</span>
        {row.canManage && <button type="button" onClick={() => openModal(row.key)} title="แก้ไขข้อมูล" className="text-gray-400 hover:text-purple-300 p-1 transition-colors"><Pencil size={13} /></button>}
      </>;
    }
    if (row.canManage) {
      return <button type="button" onClick={() => openModal(row.key)} className="rounded-lg bg-purple-600/20 border border-purple-500/30 px-3 py-1 text-[11px] font-medium text-purple-300 hover:bg-purple-600 hover:text-white transition-all">คลิกเพื่อเชื่อมต่อ</button>;
    }
    return <span className="text-[11px] font-medium text-[#5c556f]">ยังไม่รองรับ</span>;
  };

  const rows = [
    {
      key: "email",
      label: "อีเมล",
      icon: <Mail size={14} className="text-purple-400" />,
      value: user?.email || (user?.username ? "กำลังโหลด..." : "user@example.com"),
      connected: user?.isEmailVerified !== undefined ? Boolean(user.isEmailVerified) : true,
      canManage: true,
    },
    {
      key: "phone",
      label: "เบอร์โทรศัพท์",
      icon: <Phone size={14} className="text-purple-400" />,
      value: user?.phone || "000-000-0000",
      connected: user?.isPhoneVerified !== undefined ? Boolean(user.isPhoneVerified) : false,
      canManage: true,
    },
    {
      key: "discord",
      label: "DISCORD",
      icon: DiscordIcon,
      value: "ยังไม่ได้เชื่อมต่อ",
      connected: false,
      canManage: false,
    },
    {
      key: "streamlabs",
      label: "STREAMLABS",
      icon: StreamlabsIcon,
      value: "ยังไม่ได้เชื่อมต่อ",
      connected: false,
      canManage: false,
    },
  ];

  return (
    <section className="rounded-2xl border border-[#2b2542] bg-[#16122a]/80 backdrop-blur-md p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            จัดการบัญชี
          </h2>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#80779b]">
            MANAGE ACCOUNT
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-3 rounded-xl border border-[#2e2648]/60 bg-[#110d22]/50 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9891ab]">
                {row.icon}
                {row.label}
              </p>
              <p
                className={`mt-0.5 truncate text-sm font-medium ${
                  row.connected ? "text-white" : "text-[#5c556f]"
                }`}
              >
                {row.value}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {renderConnectionAction(row)}
            </div>
          </div>
        ))}
      </div>

      {/* Verification Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#16122a] p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {modalType === "email" ? <Mail size={18} className="text-purple-400" /> : <Phone size={18} className="text-purple-400" />}
                <span>{modalType === "email" ? "เชื่อมต่อและยืนยันอีเมล" : "เชื่อมต่อและยืนยันเบอร์โทรศัพท์"}</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {step === 1
                  ? `กรอก${modalType === "email" ? "อีเมล" : "เบอร์โทรศัพท์"}ของคุณเพื่อรับรหัส OTP`
                  : `กรอกรหัสยืนยัน 6 หลักที่ส่งไปยัง ${inputValue}`}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="manage-input-target" className="text-xs font-semibold text-[#d4cfdf] block mb-1.5">
                    {modalType === "email" ? "ที่อยู่อีเมล" : "เบอร์โทรศัพท์ (10 หลัก)"}
                  </label>
                  <input
                    id="manage-input-target"
                    type={modalType === "email" ? "email" : "text"}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={modalType === "email" ? "example@mail.com" : "0812345678"}
                    className="w-full rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-2.5 text-xs text-white placeholder-[#5c556f] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !inputValue.trim()}
                    className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition-all shadow-[0_0_16px_rgba(147,51,234,0.3)] disabled:opacity-50"
                  >
                    {loading ? "กำลังส่ง OTP..." : "ส่งรหัส OTP"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label htmlFor="manage-otp-input" className="text-xs font-semibold text-[#d4cfdf] block mb-1.5">
                    รหัส OTP 6 หลัก
                  </label>
                  <input
                    id="manage-otp-input"
                    type="text"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-2.5 text-center text-xl font-bold tracking-[6px] text-purple-300 placeholder-[#5c556f] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all font-mono"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                  <span>
                    {countdown > 0 ? (
                      `ขอรหัสใหม่ได้ใน ${countdown} วิ`
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp(null)}
                        disabled={loading}
                        className="text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
                      >
                        <RefreshCw size={11} />
                        <span>ส่งรหัสอีกครั้ง</span>
                      </button>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtpValue("");
                      setError("");
                    }}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    เปลี่ยนข้อมูล
                  </button>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otpValue.length !== 6}
                    className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition-all shadow-[0_0_16px_rgba(147,51,234,0.3)] disabled:opacity-50"
                  >
                    {loading ? "กำลังตรวจสอบ..." : "ยืนยันและเชื่อมต่อ"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ManageAccountCard;