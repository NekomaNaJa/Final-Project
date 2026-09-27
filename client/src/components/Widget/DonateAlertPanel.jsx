import React from "react";
import SettingsCard from "../DonatePage/SettingsCard";
import ImageUploadBox from "../DonatePage/ImageUploadBox";
import AccordionSection from "./AccordionSection";
import AudioUploadField from "./AudioUploadField";
import {
  SOUND_PRESETS,
  TTS_VOICES,
  TTS_SPEEDS,
  FONT_OPTIONS,
  FONT_WEIGHTS,
  ANIMATIONS_IN,
  ANIMATIONS_OUT,
  FILTER_EFFECTS,
} from "./widgetStorage";
import { Sparkles, Volume2, Plus, Trash2, Play } from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-2.5 text-xs sm:text-sm font-medium text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all";

const labelClass = "text-xs font-semibold text-[#d4cfdf]";

const DonateAlertPanel = ({ value, onChange, onSave }) => {
  const update = (fields) => {
    onChange({ ...value, ...fields });
  };

  const handleAddTier = () => {
    const tiers = value.amountTiers || [];
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier ? Number(lastTier.max) + 1 : 100;
    const newTier = {
      id: `tier-${Date.now()}`,
      min: newMin,
      max: newMin + 499,
      image: null,
      sound: "mythic-horn",
    };
    update({ amountTiers: [...tiers, newTier] });
  };

  const handleUpdateTier = (id, fields) => {
    const updated = (value.amountTiers || []).map((t) =>
      t.id === id ? { ...t, ...fields } : t,
    );
    update({ amountTiers: updated });
  };

  const handleDeleteTier = (id) => {
    const filtered = (value.amountTiers || []).filter((t) => t.id !== id);
    update({ amountTiers: filtered });
  };

  return (
    <SettingsCard
      title="Donate Alert"
      subtitle="REALTIME DONATION NOTIFICATIONS"
      onSave={onSave}
    >
      {/* 1. พื้นฐาน (Basic) */}
      <AccordionSection title="พื้นฐาน" defaultOpen={true}>
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>ยอดขั้นต่ำที่แจ้งเตือน (บาท)</label>
            <input
              type="number"
              min="0"
              value={value.minAmount ?? 10}
              onChange={(e) => update({ minAmount: Number(e.target.value) })}
              className={inputClass}
              placeholder="10"
            />
            <p className="text-[10px] text-[#7e778d]">
              ยอดโดเนทที่น้อยกว่านี้จะไม่แสดงผลการแจ้งเตือนบนจอ
            </p>
          </div>

          <ImageUploadBox
            label="รูปภาพแสดงผล (JPG / PNG / GIF)"
            previewUrl={value.overlayImage}
            onImageSelect={(_file, url) => update({ overlayImage: url })}
          />
        </div>
      </AccordionSection>

      {/* 2. เสียง & TTS (Audio & TTS) */}
      <AccordionSection
        title="เสียงแจ้งเตือน & ข้อความเสียง (TTS)"
        defaultOpen={false}
      >
        <div className="space-y-4">
          {/* Sound Presets & Custom MP3 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>เสียงแจ้งเตือน</label>
              <select
                value={value.soundPreset || "mythic-horn"}
                onChange={(e) => update({ soundPreset: e.target.value })}
                className={inputClass}
              >
                {SOUND_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>อัปโหลดเสียงของตัวเอง (MP3)</label>
              <AudioUploadField
                fileName={value.customSoundFile}
                onFileSelect={(name) =>
                  update({ customSoundFile: name, soundPreset: "custom" })
                }
              />
            </div>
          </div>

          {/* Sound Volume Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className={labelClass}>ระดับเสียงแจ้งเตือน</label>
              <span className="text-xs font-bold text-purple-300">
                {value.volume ?? 80}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={value.volume ?? 80}
              onChange={(e) => update({ volume: Number(e.target.value) })}
              className="accent-purple-500 cursor-pointer w-full h-1.5 bg-[#251d45] rounded-lg"
            />
          </div>

          {/* TTS Section */}
          <div className="pt-3 border-t border-[#2e2648] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-purple-400" />
                <span className="text-xs font-bold text-white">
                  TTS อ่านข้อความโดเนท
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.ttsEnabled !== false}
                  onChange={(e) => update({ ttsEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#2b2542] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {value.ttsEnabled !== false && (
              <div className="space-y-3 pl-1">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>เสียงพากย์</label>
                    <select
                      value={value.ttsVoice || "th-female"}
                      onChange={(e) => update({ ttsVoice: e.target.value })}
                      className={inputClass}
                    >
                      {TTS_VOICES.map((voice) => (
                        <option key={voice.id} value={voice.id}>
                          {voice.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>ความเร็วการอ่าน</label>
                    <select
                      value={value.ttsSpeed || "1.0x"}
                      onChange={(e) => update({ ttsSpeed: e.target.value })}
                      className={inputClass}
                    >
                      {TTS_SPEEDS.map((spd) => (
                        <option key={spd} value={spd}>
                          {spd}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className={labelClass}>ระดับเสียง TTS</label>
                    <span className="text-xs font-bold text-purple-300">
                      {value.ttsVolume ?? 80}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value.ttsVolume ?? 80}
                    onChange={(e) =>
                      update({ ttsVolume: Number(e.target.value) })
                    }
                    className="accent-purple-500 cursor-pointer w-full h-1.5 bg-[#251d45] rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </AccordionSection>

      {/* 3. ข้อความ & การจัดสไตล์ (Message & Typography) */}
      <AccordionSection title="ข้อความ & การจัดสไตล์" defaultOpen={false}>
        <div className="space-y-4">
          {/* Message Template */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Template ข้อความ (ใช้ {"{user}"} และ {"{amount}"})
            </label>
            <input
              type="text"
              value={value.template || "{user} โดเนท {amount} บาท"}
              onChange={(e) => update({ template: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Shine Effect Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-[#2e2648] bg-[#141026]">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <div>
                <p className="text-xs font-bold text-white">Shine Effect</p>
                <p className="text-[10px] text-[#7e778d]">
                  ประกายแสงสะท้อนเรืองรองบนข้อความ
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value.shineEffect !== false}
                onChange={(e) => update({ shineEffect: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#2b2542] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Font Selection & Weight */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className={labelClass}>แบบอักษร (Font Family)</label>
              <select
                value={value.fontFamily || "Kanit"}
                onChange={(e) => update({ fontFamily: e.target.value })}
                className={inputClass}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>น้ำหนัก</label>
              <select
                value={value.fontWeight || "700"}
                onChange={(e) => update({ fontWeight: e.target.value })}
                className={inputClass}
              >
                {FONT_WEIGHTS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Font Size Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className={labelClass}>ขนาดตัวอักษร</label>
              <span className="text-xs font-bold text-purple-300">
                {value.fontSize || 28} px
              </span>
            </div>
            <input
              type="range"
              min="18"
              max="60"
              value={value.fontSize || 28}
              onChange={(e) => update({ fontSize: Number(e.target.value) })}
              className="accent-purple-500 cursor-pointer w-full h-1.5 bg-[#251d45] rounded-lg"
            />
          </div>

          {/* Colors: Text, User, Amount, Stroke */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {/* Text Color */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[#cfc8dd]">
                สีข้อความ
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value.textColor || "#ffffff"}
                  onChange={(e) => update({ textColor: e.target.value })}
                  className="h-8 w-9 cursor-pointer rounded-lg border border-[#2e2648] bg-[#110d22] p-0.5"
                />
                <span className="text-[10px] text-gray-400">
                  {value.textColor || "#ffffff"}
                </span>
              </div>
            </div>

            {/* Donor Name Color */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[#cfc8dd]">
                สีชื่อผู้โดเนท
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value.userNameColor || "#c084fc"}
                  onChange={(e) => update({ userNameColor: e.target.value })}
                  className="h-8 w-9 cursor-pointer rounded-lg border border-[#2e2648] bg-[#110d22] p-0.5"
                />
                <span className="text-[10px] text-gray-400">
                  {value.userNameColor || "#c084fc"}
                </span>
              </div>
            </div>

            {/* Amount Color */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[#cfc8dd]">
                สีจำนวนเงิน
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value.amountColor || "#fbbf24"}
                  onChange={(e) => update({ amountColor: e.target.value })}
                  className="h-8 w-9 cursor-pointer rounded-lg border border-[#2e2648] bg-[#110d22] p-0.5"
                />
                <span className="text-[10px] text-gray-400">
                  {value.amountColor || "#fbbf24"}
                </span>
              </div>
            </div>

            {/* Stroke Color */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[#cfc8dd]">
                สีขอบตัวอักษร
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value.strokeColor || "#000000"}
                  onChange={(e) => update({ strokeColor: e.target.value })}
                  className="h-8 w-9 cursor-pointer rounded-lg border border-[#2e2648] bg-[#110d22] p-0.5"
                />
                <span className="text-[10px] text-gray-400">
                  {value.strokeColor || "#000000"}
                </span>
              </div>
            </div>
          </div>

          {/* Stroke Size */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className={labelClass}>
                ขนาดขอบตัวอักษร (Stroke Size)
              </label>
              <span className="text-xs font-bold text-purple-300">
                {value.strokeSize ?? 2} px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              value={value.strokeSize ?? 2}
              onChange={(e) => update({ strokeSize: Number(e.target.value) })}
              className="accent-purple-500 cursor-pointer w-full h-1.5 bg-[#251d45] rounded-lg"
            />
          </div>
        </div>
      </AccordionSection>

      {/* 4. เอฟเฟกต์ & แสดงผลตามจำนวนเงิน */}
      <AccordionSection
        title="เอฟเฟกต์ & การแสดงผลตามจำนวนเงิน"
        defaultOpen={false}
      >
        <div className="space-y-4">
          {/* In / Out Animations */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                แอนิเมชั่นเข้า (Animation In)
              </label>
              <select
                value={value.animationIn || "bounceIn"}
                onChange={(e) => update({ animationIn: e.target.value })}
                className={inputClass}
              >
                {ANIMATIONS_IN.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                แอนิเมชั่นออก (Animation Out)
              </label>
              <select
                value={value.animationOut || "fadeOut"}
                onChange={(e) => update({ animationOut: e.target.value })}
                className={inputClass}
              >
                {ANIMATIONS_OUT.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Timing Durations */}
          <div className="grid gap-3 grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#d4cfdf]">
                เวลาเข้า (วิ)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={value.durationIn ?? 0.8}
                onChange={(e) => update({ durationIn: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#d4cfdf]">
                แสดงบนจอ (วิ)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="30"
                value={value.durationDisplay ?? 5}
                onChange={(e) =>
                  update({ durationDisplay: Number(e.target.value) })
                }
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#d4cfdf]">
                เวลาออก (วิ)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={value.durationOut ?? 0.8}
                onChange={(e) =>
                  update({ durationOut: Number(e.target.value) })
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* Filter Effects */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              เอฟเฟกต์ฟิลเตอร์ (Filter Effect)
            </label>
            <select
              value={value.filterEffect || "Glow"}
              onChange={(e) => update({ filterEffect: e.target.value })}
              className={inputClass}
            >
              {FILTER_EFFECTS.map((eff) => (
                <option key={eff.id} value={eff.id}>
                  {eff.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount-based Tiers Section */}
          <div className="pt-3 border-t border-[#2e2648] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">
                  ใช้การแสดงผลตามจำนวนเงิน (Amount Tiers)
                </p>
                <p className="text-[10px] text-[#7e778d]">
                  เปลี่ยนรูปภาพและเสียงตามช่วงยอดเงินที่ได้รับ
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.useAmountTiers || false}
                  onChange={(e) => update({ useAmountTiers: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#2b2542] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {value.useAmountTiers && (
              <div className="space-y-3">
                {(value.amountTiers || []).map((tier, idx) => (
                  <div
                    key={tier.id}
                    className="p-3.5 rounded-xl border border-[#2e2648] bg-[#141026] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300">
                        ช่วงที่ {idx + 1}: {tier.min.toLocaleString()} -{" "}
                        {tier.max.toLocaleString()} บาท
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTier(tier.id)}
                        className="text-gray-400 hover:text-red-400 p-1"
                        title="ลบช่วงนี้"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-400">
                          เริ่มต้น (บาท)
                        </label>
                        <input
                          type="number"
                          value={tier.min}
                          onChange={(e) =>
                            handleUpdateTier(tier.id, {
                              min: Number(e.target.value),
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400">
                          สิ้นสุด (บาท)
                        </label>
                        <input
                          type="number"
                          value={tier.max}
                          onChange={(e) =>
                            handleUpdateTier(tier.id, {
                              max: Number(e.target.value),
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-400">
                          เสียงประจำช่วง
                        </label>
                        <select
                          value={tier.sound || "mythic-horn"}
                          onChange={(e) =>
                            handleUpdateTier(tier.id, { sound: e.target.value })
                          }
                          className={inputClass}
                        >
                          {SOUND_PRESETS.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              `ทดสอบเสียงสำหรับช่วง ${tier.min}-${tier.max} บาท`,
                            )
                          }
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#31284d] bg-[#1d1738] hover:bg-purple-600 hover:text-white text-xs font-semibold text-purple-300 transition-all"
                        >
                          <Play size={12} />
                          <span>ทดสอบช่วงนี้</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddTier}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-purple-500/40 bg-purple-950/20 hover:bg-purple-900/40 text-xs font-bold text-purple-300 transition-all"
                >
                  <Plus size={14} />
                  <span>+ เพิ่มช่วงยอดเงิน</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </AccordionSection>
    </SettingsCard>
  );
};

export default DonateAlertPanel;
