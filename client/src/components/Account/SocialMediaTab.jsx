import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Trash2,
  AlertCircle,
  X,
} from "lucide-react";
import SettingsCard from "../DonatePage/SettingsCard";
import { socialPlatforms } from "../../constants/socialPlatforms";

const MAX_INPUT_LEN = 200;
const HANDLE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,59}$/;
const DISALLOWED_HANDLES = new Set([
  "watch",
  "playlist",
  "shorts",
  "feed",
  "results",
  "channel",
  "c",
  "user",
  "profile.php",
  "share",
  "sharer",
  "sharer.php",
  "login",
  "logout",
  "dialog",
  "oauth",
  "intent",
  "home",
  "explore",
  "search",
  "settings",
  "foryou",
  "i",
]);

const PLATFORM_MAP = Object.fromEntries(
  socialPlatforms.map((p) => [p.key, p])
);

const isCleanHandle = (value) => {
  if (typeof value !== "string" || !HANDLE_PATTERN.test(value)) return false;
  if (value.endsWith(".") || value.includes("..")) return false;
  return !DISALLOWED_HANDLES.has(value.toLowerCase());
};

const removeAtPrefix = (text) =>
  text.startsWith("@") ? text.slice(1) : text;

const resolveYouTubePath = (segments) => {
  if (segments.length === 1) {
    const clean = removeAtPrefix(segments[0]);
    if (!isCleanHandle(clean)) return null;
    return { url: `https://youtube.com/@${clean}`, handle: `@${clean}` };
  }
  if (segments.length === 2) {
    const prefix = segments[0].toLowerCase();
    if (prefix !== "channel" && prefix !== "c" && prefix !== "user") return null;
    const rawTarget = segments[1];
    const clean =
      prefix === "channel" ? rawTarget : removeAtPrefix(rawTarget);
    if (!isCleanHandle(clean)) return null;
    const handle = prefix === "channel" ? clean : `@${clean}`;
    return { url: `https://youtube.com/${prefix}/${clean}`, handle };
  }
  return null;
};

const makeInvalidResult = (error) => ({
  valid: false,
  url: "",
  handle: "",
  error,
});

const parsePlatformUrl = (platformKey, meta, urlText) => {
  let parsed;
  try {
    parsed = new URL(urlText);
  } catch {
    return makeInvalidResult(`รูปแบบลิงก์ ${meta.name} ไม่ถูกต้อง`);
  }

  const hasInvalidOriginPart =
    (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
    Boolean(parsed.username || parsed.password || parsed.port);

  if (hasInvalidOriginPart) {
    return makeInvalidResult(
      `ไม่อนุญาตให้ใช้ลิงก์ที่มีข้อมูลยืนยันตัวตนหรือพอร์ตใน ${meta.name}`
    );
  }

  if (!meta.allowedHosts.includes(parsed.hostname.toLowerCase())) {
    return makeInvalidResult(`โดเมนของลิงก์ไม่ตรงกับ ${meta.name}`);
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (platformKey === "youtube") {
    const yt = resolveYouTubePath(segments);
    if (!yt) {
      return makeInvalidResult(`รูปแบบลิงก์ ${meta.name} ไม่ถูกต้อง`);
    }
    return { valid: true, url: yt.url, handle: yt.handle, error: null };
  }

  if (segments.length !== 1) {
    return makeInvalidResult(`รูปแบบลิงก์ ${meta.name} ไม่ถูกต้อง`);
  }

  const clean = removeAtPrefix(segments[0]);
  if (!isCleanHandle(clean)) {
    return makeInvalidResult(`ชื่อบัญชีในลิงก์ ${meta.name} ไม่ถูกต้อง`);
  }

  return {
    valid: true,
    url: `${meta.baseUrl}${clean}`,
    handle: `@${clean}`,
    error: null,
  };
};

const parsePlatformInput = (platformKey, rawValue) => {
  const meta = PLATFORM_MAP[platformKey];
  if (!meta || typeof rawValue !== "string") {
    return makeInvalidResult("ข้อมูลไม่ถูกต้อง");
  }
  if (rawValue.length > MAX_INPUT_LEN) {
    return makeInvalidResult(
      `ลิงก์หรือชื่อบัญชี ${meta.name} ยาวเกินกำหนด (สูงสุด ${MAX_INPUT_LEN} ตัวอักษร)`
    );
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return { valid: true, url: "", handle: "", error: null };
  }

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("https://") || lower.startsWith("http://")) {
    return parsePlatformUrl(platformKey, meta, trimmed);
  }

  if (trimmed.includes(":") || trimmed.includes("/")) {
    return makeInvalidResult(`รูปแบบลิงก์หรือชื่อบัญชี ${meta.name} ไม่ถูกต้อง`);
  }

  const clean = removeAtPrefix(trimmed);
  if (!isCleanHandle(clean)) {
    return makeInvalidResult(`ชื่อบัญชี ${meta.name} ไม่ถูกต้อง`);
  }

  return {
    valid: true,
    url: `${meta.baseUrl}${clean}`,
    handle: `@${clean}`,
    error: null,
  };
};

export const extractSocialHandle = (rawValue, platformKey = "facebook") => {
  if (typeof rawValue !== "string") return "";
  const trimmed = rawValue.trim();
  if (!trimmed) return "";

  if (PLATFORM_MAP[platformKey]) {
    const res = parsePlatformInput(platformKey, trimmed);
    return res.valid ? res.handle : "";
  }

  for (const p of socialPlatforms) {
    const res = parsePlatformInput(p.key, trimmed);
    if (res.valid && res.handle) return res.handle;
  }
  return "";
};

export const buildSocialUrl = (platformKey, rawValue) => {
  const res = parsePlatformInput(platformKey, rawValue);
  if (!res.valid || !res.url.startsWith("https://")) {
    return "";
  }
  return res.url;
};

const createInitialLinksState = (social) => ({
  facebook: buildSocialUrl("facebook", social?.facebook || ""),
  instagram: buildSocialUrl("instagram", social?.instagram || ""),
  youtube: buildSocialUrl("youtube", social?.youtube || ""),
  tiktok: buildSocialUrl("tiktok", social?.tiktok || ""),
  twitch: buildSocialUrl("twitch", social?.twitch || ""),
  x: buildSocialUrl("x", social?.x || ""),
});

const SocialPlatformReadOnlyRow = ({ platform, rawValue }) => {
  const { key, label, icon } = platform;
  const safeUrl = buildSocialUrl(key, rawValue);
  const displayHandle = extractSocialHandle(rawValue, key);
  const isAdded = Boolean(safeUrl && displayHandle);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold tracking-wider text-[#9891ab]">
        {label}
      </span>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#2e2648] bg-[#110d22] px-3.5 py-2.5 transition-all hover:border-[#3e3460]">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#1b1532]">
            {icon}
          </div>
          {isAdded ? (
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <a
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`social-handle-${key}`}
                className="truncate text-xs font-semibold text-white hover:text-purple-300 underline-offset-2 hover:underline transition-colors"
              >
                {displayHandle}
              </a>
              <span
                data-testid={`social-status-${key}`}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400"
              >
                <CheckCircle2 size={11} className="shrink-0 text-emerald-400" />
                <span>เพิ่มลิงก์แล้ว</span>
              </span>
            </div>
          ) : (
            <span
              data-testid={`social-status-${key}`}
              className="text-xs text-[#5c556f]"
            >
              ยังไม่ได้เพิ่ม
            </span>
          )}
        </div>

        {isAdded && (
          <div className="flex shrink-0 items-center gap-1.5">
            <a
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`เปิดลิงก์ ${label}`}
              className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-medium text-purple-300 hover:bg-purple-500/20 hover:text-white transition-all"
            >
              <ExternalLink size={11} />
              <span>เยี่ยมชม</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

const SocialPlatformEditRow = ({
  platform,
  inputValue,
  savedValue,
  errorText,
  onChange,
  onClear,
}) => {
  const { key, label, icon, placeholder } = platform;
  const safeSavedUrl = buildSocialUrl(key, savedValue);
  const savedHandle = extractSocialHandle(savedValue, key);
  const previewUrl = buildSocialUrl(key, inputValue);
  const isAdded = Boolean(safeSavedUrl && savedHandle);
  const hasContent = Boolean(inputValue?.trim() || isAdded);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={`social-input-${key}`}
          className="text-[11px] font-bold tracking-wider text-[#9891ab]"
        >
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          {isAdded ? (
            <>
              <span
                data-testid={`social-handle-${key}`}
                className="truncate text-[11px] font-semibold text-purple-300 max-w-[140px]"
              >
                {savedHandle}
              </span>
              <span
                data-testid={`social-status-${key}`}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400"
              >
                <CheckCircle2 size={11} className="shrink-0 text-emerald-400" />
                <span>เพิ่มลิงก์แล้ว</span>
              </span>
            </>
          ) : (
            <span
              data-testid={`social-status-${key}`}
              className="text-[11px] text-[#5c556f]"
            >
              ยังไม่ได้เพิ่ม
            </span>
          )}
        </div>
      </div>

      <div
        className={`flex items-center gap-2 rounded-xl border bg-[#110d22] px-3 py-2 transition-all ${
          errorText
            ? "border-red-500/60 focus-within:border-red-500"
            : "border-[#2e2648] hover:border-[#3e3460] focus-within:border-purple-500"
        }`}
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#1b1532]">
          {icon}
        </div>
        <input
          id={`social-input-${key}`}
          aria-label={`ลิงก์หรือชื่อบัญชี ${label}`}
          type="text"
          maxLength={MAX_INPUT_LEN}
          value={inputValue}
          onChange={(e) => onChange(key, e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-xs text-white placeholder-[#5c556f] focus:outline-none"
        />
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`เปิดลิงก์ ${label}`}
            title="เปิดลิงก์เพื่อตรวจสอบ"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2 py-1 text-[11px] font-medium text-purple-300 hover:bg-purple-500/20 hover:text-white transition-all"
          >
            <ExternalLink size={11} />
            <span>เปิดลิงก์</span>
          </a>
        )}
        {hasContent && (
          <button
            type="button"
            aria-label={`ลบลิงก์ ${label}`}
            title="ลบลิงก์"
            onClick={() => onClear(key)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all"
          >
            <Trash2 size={11} />
            <span>ลบลิงก์</span>
          </button>
        )}
      </div>

      {errorText && (
        <p
          data-testid={`social-error-${key}`}
          className="text-[11px] font-medium text-red-400"
        >
          {errorText}
        </p>
      )}
    </div>
  );
};

const SocialMediaTab = ({ user, onSave, readOnly = false }) => {
  const [savedLinks, setSavedLinks] = useState(() =>
    createInitialLinksState(user?.social)
  );
  const [inputs, setInputs] = useState(() =>
    createInitialLinksState(user?.social)
  );
  const [fieldErrors, setFieldErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    const normalized = createInitialLinksState(user?.social);
    setSavedLinks(normalized);
    setInputs(normalized);
    setFieldErrors({});
  }, [user]);

  if (readOnly) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {socialPlatforms.map((platform) => (
          <SocialPlatformReadOnlyRow
            key={platform.key}
            platform={platform}
            rawValue={savedLinks[platform.key]}
          />
        ))}
      </div>
    );
  }

  const handleInputChange = (key, value) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (statusMessage?.type === "error") {
      setStatusMessage(null);
    }
  };

  const handleClearLink = (key) => {
    const platformName = PLATFORM_MAP[key]?.name || key;
    const nextInputs = { ...inputs, [key]: "" };
    const nextSaved = { ...savedLinks, [key]: "" };
    setInputs(nextInputs);
    setSavedLinks(nextSaved);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setStatusMessage({
      type: "success",
      text: `ลบลิงก์ ${platformName} เรียบร้อยแล้ว`,
    });
    if (onSave) {
      void Promise.resolve(onSave({ social: nextSaved }));
    }
  };

  const handleSave = () => {
    const nextErrors = {};
    const normalizedPayload = {};

    for (const platform of socialPlatforms) {
      const result = parsePlatformInput(platform.key, inputs[platform.key] || "");
      if (!result.valid) {
        nextErrors[platform.key] = result.error;
      } else {
        normalizedPayload[platform.key] = result.url;
      }
    }

    const errorKeys = Object.keys(nextErrors);
    if (errorKeys.length > 0) {
      setFieldErrors(nextErrors);
      setStatusMessage({
        type: "error",
        text: nextErrors[errorKeys[0]],
      });
      return;
    }

    setFieldErrors({});
    setSavedLinks(normalizedPayload);
    setInputs(normalizedPayload);
    setStatusMessage({
      type: "success",
      text: "บันทึกลิงก์โซเชียลมีเดียเรียบร้อยแล้ว",
    });

    if (onSave) {
      void Promise.resolve(onSave({ social: normalizedPayload }));
    }
  };

  return (
    <SettingsCard
      title="โซเชียลมีเดีย"
      subtitle="SOCIAL MEDIA"
      saveText="บันทึกลิงก์"
      onSave={handleSave}
      hideSave={readOnly}
    >
      <p className="text-xs text-[#9891ab]">
        ระบุชื่อบัญชี (@handle) หรือวางลิงก์หน้าโปรไฟล์ของคุณในแต่ละแพลตฟอร์ม (เว้นว่างหรือกดลบลิงก์เพื่อนำออก)
      </p>

      {statusMessage && (
        <div
          role="status"
          className={`rounded-xl border p-3 text-xs flex items-center justify-between ${
            statusMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle size={14} className="shrink-0 text-red-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            aria-label="ปิดข้อความแจ้งเตือน"
            onClick={() => setStatusMessage(null)}
            className="text-gray-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {socialPlatforms.map((platform) => (
          <SocialPlatformEditRow
            key={platform.key}
            platform={platform}
            inputValue={inputs[platform.key]}
            savedValue={savedLinks[platform.key]}
            errorText={fieldErrors[platform.key]}
            onChange={handleInputChange}
            onClear={handleClearLink}
          />
        ))}
      </div>
    </SettingsCard>
  );
};

export default SocialMediaTab;
