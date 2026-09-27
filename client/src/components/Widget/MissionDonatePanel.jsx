import React from "react";
import SettingsCard from "../DonatePage/SettingsCard";
import AccordionSection from "./AccordionSection";
import { Plus, Trash2, Info } from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-2.5 text-xs sm:text-sm font-medium text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all";

const labelClass = "text-xs font-semibold text-[#d4cfdf]";

const MissionDonatePanel = ({ value, onChange, onSave }) => {
  const missions = value.missions || [];

  const update = (fields) => {
    onChange({ ...value, ...fields });
  };

  const handleAddSlot = () => {
    if (missions.length >= 12) {
      alert("สามารถเพิ่มช่องภารกิจได้สูงสุด 12 ช่องเท่านั้น");
      return;
    }
    const newSlot = {
      id: `m-${Date.now()}`,
      name: `ภารกิจที่ ${missions.length + 1}`,
      price: 50,
    };
    update({ missions: [...missions, newSlot] });
  };

  const handleUpdateSlot = (id, fields) => {
    const updated = missions.map((m) =>
      m.id === id ? { ...m, ...fields } : m,
    );
    update({ missions: updated });
  };

  const handleDeleteSlot = (id) => {
    const filtered = missions.filter((m) => m.id !== id);
    update({ missions: filtered });
  };

  return (
    <SettingsCard
      title="Mission Donate"
      subtitle="DONATION MISSION SLOTS"
      onSave={onSave}
    >
      {/* Informational Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-purple-500/30 bg-purple-950/30 text-purple-200">
        <Info size={18} className="shrink-0 text-purple-400 mt-0.5" />
        <p className="text-xs leading-relaxed">
          วิดเจ็ตภารกิจนี้จะนำไปแสดงผลบน **หน้ารับเงิน (Donor Page)** โดยตรง
          เพื่อให้ผู้สนับสนุนเลือกทำภารกิจและโดเนทตามราคาที่กำหนด (ไม่ต้องใช้
          Browser Source URL)
        </p>
      </div>

      {/* 1. ข้อมูลหัวข้อ */}
      <AccordionSection title="ข้อมูลหัวข้อภารกิจ" defaultOpen={true}>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>ชื่อหัวข้อภารกิจ</label>
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => update({ title: e.target.value })}
            className={inputClass}
            placeholder="เช่น ภารกิจสตรีมเมอร์วันนี้, MISSION DONATE"
          />
        </div>
      </AccordionSection>

      {/* 2. ช่องภารกิจ (สูงสุด 12 ช่อง) */}
      <AccordionSection
        title={`รายการช่องภารกิจ (${missions.length}/12 ช่อง)`}
        defaultOpen={true}
      >
        <div className="space-y-3">
          {missions.map((slot, index) => (
            <div
              key={slot.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-[#2e2648] bg-[#141026]"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#241c3e] font-bold text-xs text-purple-300">
                {index + 1}
              </div>

              {/* Mission Name */}
              <div className="flex-1">
                <input
                  type="text"
                  value={slot.name}
                  onChange={(e) =>
                    handleUpdateSlot(slot.id, { name: e.target.value })
                  }
                  placeholder="ชื่อภารกิจ เช่น เล่นเกมมือเดียว 1 ตา"
                  className={inputClass}
                />
              </div>

              {/* Price */}
              <div className="w-28 sm:w-36 flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  value={slot.price}
                  onChange={(e) =>
                    handleUpdateSlot(slot.id, { price: Number(e.target.value) })
                  }
                  placeholder="ราคา"
                  className={inputClass}
                />
                <span className="text-xs text-gray-400 font-bold">฿</span>
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleDeleteSlot(slot.id)}
                className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                title="ลบภารกิจนี้"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {missions.length < 12 && (
            <button
              type="button"
              onClick={handleAddSlot}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-purple-500/40 bg-purple-950/20 hover:bg-purple-900/40 text-xs sm:text-sm font-bold text-purple-300 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>+ เพิ่มช่องภารกิจ ({missions.length}/12)</span>
            </button>
          )}
        </div>
      </AccordionSection>
    </SettingsCard>
  );
};

export default MissionDonatePanel;
