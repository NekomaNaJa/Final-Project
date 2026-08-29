import React, { useState } from "react";
import SettingsCard from "../DonatePage/SettingsCard";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

const PasswordInput = ({ label, name, value, onChange }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#d4cfdf]">{label}</label>
      <div className="relative flex items-center rounded-xl border border-[#2e2648] bg-[#110d22] px-3 py-2.5 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/30 transition-all">
        <Lock size={14} className="mr-2.5 shrink-0 text-[#6e6682]" />
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder="••••••••••••"
          className="w-full bg-transparent text-xs text-white placeholder-[#5c556f] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="ml-2 shrink-0 text-[#6e6682] hover:text-white transition-colors"
          aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
};

const SecurityTab = () => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Saving security settings:", { ...form, twoFactorEnabled });
  };

  return (
    <SettingsCard title="ความปลอดภัย" subtitle="SECURITY" onSave={handleSave}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordInput
            label="รหัสผ่านปัจจุบัน"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
          />
          <div className="hidden sm:block" />
          <PasswordInput
            label="รหัสผ่านใหม่"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
          />
          <PasswordInput
            label="ยืนยันรหัสผ่าน"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
          />
        </div>

        <div className="flex items-start justify-between gap-3 rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
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