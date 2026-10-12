import React, { useState, useRef } from "react";
import { Pencil, Copy, Check, Camera, Trash2, Loader2 } from "lucide-react";

const AccountProfileCard = ({ user, onSave }) => {
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const fileInputRef = useRef(null);

  const username = user?.username || "Test";
  const donixUrl = `https://final-project-orpin-five.vercel.app/${username}`;
  const isLive = Boolean(user?.isLive);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(donixUrl);
      }
    } catch {
      // Ignore clipboard write failure
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleLive = () => {
    onSave?.({ isLive: !isLive });
  };

  const handleAvatarFile = (file) => {
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/i)) {
      setAvatarError("รองรับเฉพาะไฟล์รูปภาพประเภท JPG, PNG, GIF หรือ WEBP");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setAvatarError("ขนาดไฟล์รูปภาพต้องไม่เกิน 3 MB เพื่อการแสดงผลที่รวดเร็ว");
      return;
    }

    setAvatarError(null);
    setIsUploading(true);

    if (typeof FileReader !== "undefined") {
      const reader = new FileReader();
      let handled = false;

      const onDone = async () => {
        if (handled) return;
        handled = true;
        try {
          const resultUrl = reader.result;
          if (resultUrl) {
            await onSave?.({ avatar: resultUrl });
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("donix_avatar_changed", { detail: resultUrl }));
            }
          }
        } catch (err) {
          setAvatarError(err.message || "เกิดข้อผิดพลาดในการบันทึกรูปโปรไฟล์");
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };

      reader.onload = onDone;
      reader.onloadend = onDone;
      reader.onerror = () => {
        setAvatarError("ไม่สามารถอ่านไฟล์รูปภาพได้");
        setIsUploading(false);
      };

      try {
        reader.readAsDataURL(file);
        return;
      } catch {
        // Fallback
      }
    }

    setIsUploading(false);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarFile(file);
    }
  };

  const handleRemoveAvatar = async (e) => {
    e.stopPropagation();
    try {
      setIsUploading(true);
      setAvatarError(null);
      await onSave?.({ avatar: "" });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("donix_avatar_changed", { detail: "" }));
      }
    } catch (err) {
      setAvatarError(err.message || "เกิดข้อผิดพลาดในการลบรูปโปรไฟล์");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formattedJoinedDate =
    user?.joinedAt ||
    (user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "—");

  return (
    <section className="rounded-2xl border border-[#2b2542] bg-[#16122a]/80 backdrop-blur-md p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] flex flex-col items-center text-center">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="อัปโหลดรูปโปรไฟล์"
      />

      {/* Avatar Container */}
      <div className="relative group">
        <div
          role="button"
          tabIndex={0}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !isUploading) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
          aria-label="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
          className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full border-2 border-purple-500 shadow-[0_0_24px_rgba(168,85,247,0.35)] bg-[#1b1630] text-3xl font-bold text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-[#16122a] transition-all"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={username}
              className="h-full w-full object-cover"
            />
          ) : (
            username?.[0]?.toUpperCase() || "T"
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-[10px] text-white font-medium">
            <Camera size={18} />
            <span>เปลี่ยนรูป</span>
          </div>

          {/* Loading Spinner */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
              <Loader2 size={24} className="text-purple-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Change Avatar Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="เปลี่ยนรูปโปรไฟล์"
          aria-label="เปลี่ยนรูปโปรไฟล์"
          className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-[#2e2648] bg-[#221a3e] text-gray-300 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          <Pencil size={13} />
        </button>

        {/* Delete Avatar Button (Only when avatar exists) */}
        {user?.avatar && (
          <button
            type="button"
            onClick={handleRemoveAvatar}
            disabled={isUploading}
            title="ลบรูปโปรไฟล์"
            aria-label="ลบรูปโปรไฟล์"
            className="absolute -top-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-red-500/40 bg-[#22142a] text-red-400 hover:bg-red-600 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Error Message */}
      {avatarError && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {avatarError}
        </p>
      )}

      {/* Name */}
      <h2 className="mt-4 text-xl font-bold text-white">{username}</h2>

      {/* Donix URL */}
      <button
        type="button"
        onClick={handleCopy}
        title="คัดลอกลิงก์"
        className="mt-1 flex items-center gap-1.5 text-xs text-[#9891ab] hover:text-purple-300 transition-colors"
      >
        <span>{donixUrl}</span>
        {copied ? (
          <Check size={12} className="text-emerald-400" />
        ) : (
          <Copy size={12} />
        )}
      </button>

      {/* Live Status Toggle */}
      <div className="mt-4 w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
        <div className="flex items-center gap-2 text-left">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              isLive
                ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                : "bg-gray-500"
            }`}
          />
          <div>
            <p className="text-[11px] font-semibold text-white">
              {isLive ? "เปิดรับโดเนท (LIVE)" : "ปิดรับโดเนท (OFFLINE)"}
            </p>
            <p className="text-[9px] text-gray-400">
              {isLive ? "ผู้สนับสนุนสามารถโอนเงินได้" : "หน้ารับเงินจะแสดงสถานะออฟไลน์"}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isLive}
          onClick={handleToggleLive}
          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-medium transition-all ${
            isLive
              ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
              : "bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.3)]"
          }`}
        >
          {isLive ? "ปิดรับเงิน" : "เปิดรับเงิน"}
        </button>
      </div>

      {/* Stats */}
      <div className="mt-4 grid w-full grid-cols-3 divide-x divide-[#2b2542] border-t border-[#2b2542] pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#7e778d]">
            เข้าร่วมเมื่อ
          </p>
          <p className="mt-1 text-xs font-semibold text-white">
            {formattedJoinedDate}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#7e778d]">
            อายุ
          </p>
          <p className="mt-1 text-xs font-semibold text-white">
            {user?.age || "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#7e778d]">
            ผู้ติดตาม
          </p>
          <p className="mt-1 text-xs font-semibold text-white">
            {user?.followers ?? "—"}
          </p>
        </div>
      </div>
    </section>
  );
};

export default AccountProfileCard;