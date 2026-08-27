import React, { useState } from "react";
import SettingsCard from "../DonatePage/SettingsCard";
import { ChevronDown } from "lucide-react";

const UserInfoTab = ({ user }) => {
  const [form, setForm] = useState({
    nickname: user?.username || "Test",
    fullName: "",
    birthDate: "",
    gender: "",
    bio: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Saving user information:", form);
  };

  return (
    <SettingsCard
      title="ข้อมูลผู้ใช้งาน"
      subtitle="USER INFORMATION"
      onSave={handleSave}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#d4cfdf]">ชื่อเล่น</label>
          <input
            type="text"
            name="nickname"
            value={form.nickname}
            onChange={handleChange}
            placeholder="Test"
            className="w-full rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-2.5 text-xs font-medium text-white placeholder-[#5c556f] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#d4cfdf]">ชื่อ-สกุล</label>
          <input
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="ชื่อ - นามสกุล"
            className="w-full rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-2.5 text-xs font-medium text-white placeholder-[#5c556f] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#d4cfdf]">วันเกิด</label>
          <input
            type="text"
            name="birthDate"
            value={form.birthDate}
            onChange={handleChange}
            placeholder="DD / MM / YYYY"
            className="w-full rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-2.5 text-xs font-medium text-white placeholder-[#5c556f] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#d4cfdf]">เพศ</label>
          <div className="relative">
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full appearance-none rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-2.5 text-xs font-medium text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all cursor-pointer pr-10"
            >
              <option value="" className="bg-[#16122a] text-[#5c556f]">
                ระบุเพศ
              </option>
              <option value="male" className="bg-[#16122a] text-white">
                ชาย
              </option>
              <option value="female" className="bg-[#16122a] text-white">
                หญิง
              </option>
              <option value="other" className="bg-[#16122a] text-white">
                ไม่ระบุ
              </option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-[#d4cfdf]">เกี่ยวกับฉัน</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={4}
            placeholder="แนะนำตัวสั้นๆ ให้ผู้ติดตามรู้จัก"
            className="w-full resize-none rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-3 text-xs font-medium text-white placeholder-[#5c556f] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
          />
        </div>
      </div>
    </SettingsCard>
  );
};

export default UserInfoTab;