export const ALLOWED_SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
  "twitch",
  "x",
];

export const MAX_SOCIAL_INPUT_LENGTH = 200;
export const MAX_SOCIAL_HANDLE_LENGTH = 60;

const RESERVED_PATH_SEGMENTS = new Set([
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
  "messages",
  "notifications",
  "i",
]);

export const SOCIAL_PLATFORM_CONFIG = {
  facebook: {
    label: "Facebook",
    allowedHosts: [
      "facebook.com",
      "www.facebook.com",
      "m.facebook.com",
      "fb.com",
      "www.fb.com",
    ],
    buildCanonicalUrl: (handle) => `https://facebook.com/${handle}`,
  },
  instagram: {
    label: "Instagram",
    allowedHosts: ["instagram.com", "www.instagram.com"],
    buildCanonicalUrl: (handle) => `https://instagram.com/${handle}`,
  },
  youtube: {
    label: "YouTube",
    allowedHosts: ["youtube.com", "www.youtube.com", "m.youtube.com"],
    buildCanonicalUrl: (handle, prefix = "@") =>
      prefix === "@"
        ? `https://youtube.com/@${handle}`
        : `https://youtube.com/${prefix}/${handle}`,
  },
  tiktok: {
    label: "TikTok",
    allowedHosts: [
      "tiktok.com",
      "www.tiktok.com",
      "m.tiktok.com",
      "vm.tiktok.com",
    ],
    buildCanonicalUrl: (handle) => `https://tiktok.com/@${handle}`,
  },
  twitch: {
    label: "Twitch",
    allowedHosts: ["twitch.tv", "www.twitch.tv", "m.twitch.tv"],
    buildCanonicalUrl: (handle) => `https://twitch.tv/${handle}`,
  },
  x: {
    label: "X",
    allowedHosts: [
      "x.com",
      "www.x.com",
      "twitter.com",
      "www.twitter.com",
      "mobile.twitter.com",
    ],
    buildCanonicalUrl: (handle) => `https://x.com/${handle}`,
  },
};

const isAllowedHandleCharCode = (code) =>
  (code >= 48 && code <= 57) || // 0-9
  (code >= 65 && code <= 90) || // A-Z
  (code >= 97 && code <= 122) || // a-z
  code === 95 || // _
  code === 45 || // -
  code === 46; // .

export const isValidSocialHandle = (handle) => {
  if (typeof handle !== "string") return false;
  const len = handle.length;
  if (len < 1 || len > MAX_SOCIAL_HANDLE_LENGTH) return false;
  if (handle.startsWith(".") || handle.endsWith(".") || handle.includes("..")) {
    return false;
  }
  if (RESERVED_PATH_SEGMENTS.has(handle.toLowerCase())) {
    return false;
  }
  for (let i = 0; i < len; i += 1) {
    if (!isAllowedHandleCharCode(handle.codePointAt(i))) {
      return false;
    }
  }
  return true;
};

const stripLeadingAt = (value) =>
  value.startsWith("@") ? value.slice(1) : value;

const extractYouTubeTarget = (segments) => {
  if (segments.length === 1) {
    const cleanHandle = stripLeadingAt(segments[0]);
    if (!isValidSocialHandle(cleanHandle)) return null;
    return {
      url: SOCIAL_PLATFORM_CONFIG.youtube.buildCanonicalUrl(cleanHandle, "@"),
      handle: `@${cleanHandle}`,
    };
  }

  if (segments.length === 2) {
    const prefix = segments[0].toLowerCase();
    if (prefix !== "channel" && prefix !== "c" && prefix !== "user") {
      return null;
    }
    const rawTarget = segments[1];
    const cleanTarget =
      prefix === "channel" ? rawTarget : stripLeadingAt(rawTarget);
    if (!isValidSocialHandle(cleanTarget)) return null;
    return {
      url: SOCIAL_PLATFORM_CONFIG.youtube.buildCanonicalUrl(cleanTarget, prefix),
      handle: prefix === "channel" ? cleanTarget : `@${cleanTarget}`,
    };
  }

  return null;
};

const extractStandardTarget = (config, segments) => {
  if (segments.length !== 1) return null;
  const rawSeg = segments[0];
  const cleanHandle = rawSeg.startsWith("@") ? rawSeg.slice(1) : rawSeg;
  if (!isValidSocialHandle(cleanHandle)) return null;
  return {
    url: config.buildCanonicalUrl(cleanHandle),
    handle: `@${cleanHandle}`,
  };
};

const parseSocialUrl = (platform, config, urlString) => {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return {
      valid: false,
      value: "",
      error: `รูปแบบลิงก์ ${config.label} ไม่ถูกต้อง`,
    };
  }

  if (parsed.username || parsed.password || parsed.port) {
    return {
      valid: false,
      value: "",
      error: `ไม่อนุญาตให้ระบุข้อมูลยืนยันตัวตนหรือพอร์ตในลิงก์ ${config.label}`,
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!config.allowedHosts.includes(hostname)) {
    return {
      valid: false,
      value: "",
      error: `โดเมนของลิงก์ไม่ตรงกับแพลตฟอร์ม ${config.label}`,
    };
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return {
      valid: false,
      value: "",
      error: `ไม่พบชื่อบัญชีในลิงก์ ${config.label}`,
    };
  }

  const target =
    platform === "youtube"
      ? extractYouTubeTarget(segments)
      : extractStandardTarget(config, segments);

  if (!target) {
    return {
      valid: false,
      value: "",
      error: `รูปแบบลิงก์หรือชื่อบัญชี ${config.label} ไม่ถูกต้อง`,
    };
  }

  return {
    valid: true,
    value: target.url,
    handle: target.handle,
  };
};

export const normalizeSocialLink = (platform, rawInput) => {
  if (
    typeof platform !== "string" ||
    !Object.hasOwn(SOCIAL_PLATFORM_CONFIG, platform)
  ) {
    return {
      valid: false,
      value: "",
      error: "แพลตฟอร์มโซเชียลมีเดียไม่ถูกต้อง",
    };
  }

  const config = SOCIAL_PLATFORM_CONFIG[platform];

  if (typeof rawInput !== "string") {
    return {
      valid: false,
      value: "",
      error: `ข้อมูลโซเชียล ${platform} ไม่ถูกต้อง`,
    };
  }

  const safeRaw = String(rawInput);
  if (safeRaw.length > MAX_SOCIAL_INPUT_LENGTH) {
    return {
      valid: false,
      value: "",
      error: `ลิงก์หรือชื่อบัญชี ${config.label} ยาวเกินกำหนด (สูงสุด ${MAX_SOCIAL_INPUT_LENGTH} ตัวอักษร)`,
    };
  }

  const trimmed = safeRaw.trim();
  if (!trimmed) {
    return {
      valid: true,
      value: "",
      handle: "",
    };
  }

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("https://") || lower.startsWith("http://")) {
    return parseSocialUrl(platform, config, trimmed);
  }

  if (trimmed.includes(":") || trimmed.includes("/")) {
    return {
      valid: false,
      value: "",
      error: `รูปแบบลิงก์หรือชื่อบัญชี ${config.label} ไม่ถูกต้อง`,
    };
  }

  const cleanHandle = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  if (!isValidSocialHandle(cleanHandle)) {
    return {
      valid: false,
      value: "",
      error: `ชื่อบัญชี ${config.label} ไม่ถูกต้อง`,
    };
  }

  return {
    valid: true,
    value: config.buildCanonicalUrl(cleanHandle),
    handle: `@${cleanHandle}`,
  };
};

export const validateSocialPayload = (social) => {
  if (typeof social !== "object" || social === null || Array.isArray(social)) {
    return {
      valid: false,
      error: "ข้อมูลโซเชียลมีเดียไม่ถูกต้อง",
      data: null,
    };
  }

  const normalized = {};
  for (const [platform, rawValue] of Object.entries(social)) {
    if (!ALLOWED_SOCIAL_PLATFORMS.includes(platform)) {
      continue;
    }
    const result = normalizeSocialLink(platform, rawValue);
    if (!result.valid) {
      return {
        valid: false,
        error: result.error,
        data: null,
      };
    }
    normalized[platform] = result.value;
  }

  return {
    valid: true,
    error: null,
    data: normalized,
  };
};

export const sanitizeStoredSocialLinks = (social) => {
  const sanitized = {};
  for (const platform of ALLOWED_SOCIAL_PLATFORMS) {
    const rawValue = social?.[platform];
    if (typeof rawValue !== "string" || !rawValue.trim()) {
      sanitized[platform] = "";
      continue;
    }
    const result = normalizeSocialLink(platform, rawValue);
    sanitized[platform] = result.valid ? result.value : "";
  }
  return sanitized;
};
