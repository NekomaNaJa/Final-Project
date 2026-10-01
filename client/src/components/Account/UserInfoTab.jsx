import React, { useState } from "react";
import SettingsCard from "../DonatePage/SettingsCard";
import {
  fieldClassName,
  fieldLabelClassName,
  fieldWrapperClassName,
} from "../shared/socialFieldStyles";
import { ChevronDown } from "lucide-react";

const GENDER_OPTIONS = [
  { value: "", label: "ระบุเพศ" },
  { value: "male", label: "ชาย" },
  { value: "female", label: "หญิง" },
  { value: "other", label: "ไม่ระบุ" },
];

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
        <div className={fieldWrapperClassName}>
          <label className={fieldLabelClassName}>ชื่อเล่น</label>
          <input
            type="text"
            name="nickname"
            value={form.nickname}
            onChange={handleChange}
            placeholder="Test"
            className={fieldClassName}
          />
        </div>

        <div className={fieldWrapperClassName}>
          <label className={fieldLabelClassName}>ชื่อ-สกุล</label>
          <input
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="ชื่อ - นามสกุล"
            className={fieldClassName}
          />
        </div>

        <div className={fieldWrapperClassName}>
          <label className={fieldLabelClassName}>วันเกิด</label>
          <input
            type="text"
            name="birthDate"
            value={form.birthDate}
            onChange={handleChange}
            placeholder="DD / MM / YYYY"
            className={fieldClassName}
          />
        </div>

        <div className={fieldWrapperClassName}>
          <label className={fieldLabelClassName}>เพศ</label>
          <div className="relative">
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className={`${fieldClassName} appearance-none cursor-pointer pr-10`}
            >
              {GENDER_OPTIONS.map(({ value, label }) => (
                <option
                  key={value}
                  value={value}
                  className={
                    value
                      ? "bg-[#16122a] text-white"
                      : "bg-[#16122a] text-[#5c556f]"
                  }
                >
                  {label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        <div className={`${fieldWrapperClassName} sm:col-span-2`}>
          <label className={fieldLabelClassName}>เกี่ยวกับฉัน</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={4}
            placeholder="แนะนำตัวสั้นๆ ให้ผู้ติดตามรู้จัก"
            className={`${fieldClassName} resize-none py-3`}
          />
        </div>
      </div>
    </SettingsCard>
  );
};

export default UserInfoTab;
