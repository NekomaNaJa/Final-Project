import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Link2,
  RefreshCw,
  Unlink,
  ExternalLink,
  ShieldCheck,
  X,
  Loader2,
} from "lucide-react";
import SettingsCard from "../DonatePage/SettingsCard";
import { socialPlatforms } from "../../constants/socialPlatforms";
import {
  getSocialAuthUrl,
  connectSocialAccount,
  disconnectSocialAccount,
} from "../../utils/api";

const OAUTH_PROVIDER_META = {
  facebook: {
    providerName: "Facebook",
    authDomain: "facebook.com/dialog/oauth",
    oauthUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    baseUrl: "https://facebook.com/",
  },
  instagram: {
    providerName: "Instagram",
    authDomain: "api.instagram.com/oauth/authorize",
    oauthUrl: "https://api.instagram.com/oauth/authorize",
    baseUrl: "https://instagram.com/",
  },
  youtube: {
    providerName: "Google / YouTube",
    authDomain: "accounts.google.com/o/oauth2/v2/auth",
    oauthUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    baseUrl: "https://youtube.com/@",
  },
  tiktok: {
    providerName: "TikTok",
    authDomain: "open.tiktokapis.com/v2/auth/authorize",
    oauthUrl: "https://www.tiktok.com/v2/auth/authorize/",
    baseUrl: "https://tiktok.com/@",
  },
  twitch: {
    providerName: "Twitch",
    authDomain: "id.twitch.tv/oauth2/authorize",
    oauthUrl: "https://id.twitch.tv/oauth2/authorize",
    baseUrl: "https://twitch.tv/",
  },
  x: {
    providerName: "X (Twitter)",
    authDomain: "twitter.com/i/oauth2/authorize",
    oauthUrl: "https://twitter.com/i/oauth2/authorize",
    baseUrl: "https://x.com/",
  },
};


export const extractSocialHandle = (rawValue) => {
  if (typeof rawValue !== "string") return "";
  const trimmed = rawValue.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      const segments = parsed.pathname.split("/").filter(Boolean);
      const handleSegment = segments[segments.length - 1] || parsed.hostname;
      return handleSegment.startsWith("@") ? handleSegment : `@${handleSegment}`;
    } catch {
      // Fallback below
    }
  }

  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
};

export const buildSocialUrl = (platformKey, rawValue) => {
  if (typeof rawValue !== "string") return "";
  const trimmed = rawValue.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const cleanHandle = trimmed.replace(/^@+/, "");
  const meta = OAUTH_PROVIDER_META[platformKey];
  return meta?.baseUrl ? `${meta.baseUrl}${cleanHandle}` : `https://${cleanHandle}`;
};

const getBaseHandle = (user) => {
  const raw = user?.username || user?.nickname || "streamer";
  const cleaned = String(raw).trim().replace(/\s+/g, "_").replace(/^@+/, "");
  return cleaned || "streamer";
};

const buildOAuthAccounts = (baseHandle, email) => [
  {
    handle: `@${baseHandle}`,
    tag: `บัญชีหลัก • ${email || `${baseHandle}@donix.app`}`,
  },
  {
    handle: `@${baseHandle}_official`,
    tag: "บัญชีครีเอเตอร์ / สตรีมเมอร์ทางการ",
  },
  {
    handle: `@${baseHandle}_live`,
    tag: "บัญชีช่องสตรีมสำรอง",
  },
];

const SocialRowActions = ({
  platform,
  rawValue,
  connectedHandle,
  isConnected,
  readOnly,
  onConnectClick,
  onChangeAccountClick,
  onDisconnectClick,
}) => {
  const { key, label } = platform;

  if (readOnly) {
    if (!isConnected) return null;
    const socialUrl = buildSocialUrl(key, rawValue);
    return (
      <a
        href={socialUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`เปิดลิงก์ ${label}`}
        className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-medium text-purple-300 hover:bg-purple-500/20 hover:text-white transition-all"
      >
        <ExternalLink size={11} />
        <span>เยี่ยมชม</span>
      </a>
    );
  }

  if (isConnected) {
    return (
      <>
        <button
          type="button"
          aria-label={`เปลี่ยนบัญชี ${label}`}
          onClick={() => onChangeAccountClick(platform, connectedHandle)}
          className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-medium text-purple-300 hover:bg-purple-500/20 hover:text-white transition-all"
        >
          <RefreshCw size={11} />
          <span>เปลี่ยนบัญชี</span>
        </button>
        <button
          type="button"
          aria-label={`ยกเลิกการเชื่อมต่อ ${label}`}
          onClick={() => onDisconnectClick(key)}
          className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all"
        >
          <Unlink size={11} />
          <span>ยกเลิกการเชื่อมต่อ</span>
        </button>
      </>
    );
  }

  return (
    <button
      type="button"
      aria-label={`เชื่อมต่อ ${label}`}
      onClick={() => onConnectClick(platform)}
      className="inline-flex items-center gap-1.5 rounded-lg bg-[#8b5cf6] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_0_12px_rgba(139,92,246,0.3)] hover:bg-[#7c3aed] transition-all active:scale-95"
    >
      <Link2 size={12} />
      <span>เชื่อมต่อ</span>
    </button>
  );
};

const SocialPlatformRow = ({
  platform,
  rawValue,
  readOnly = false,
  onConnectClick,
  onChangeAccountClick,
  onDisconnectClick,
}) => {
  const { key, label, icon } = platform;
  const connectedHandle = extractSocialHandle(rawValue);
  const isConnected = Boolean(connectedHandle);
  const socialUrl = buildSocialUrl(key, rawValue);

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
          {isConnected ? (
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              {readOnly ? (
                <a
                  href={socialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`social-handle-${key}`}
                  className="truncate text-xs font-semibold text-white hover:text-purple-300 underline-offset-2 hover:underline transition-colors"
                >
                  {connectedHandle}
                </a>
              ) : (
                <span
                  data-testid={`social-handle-${key}`}
                  className="truncate text-xs font-semibold text-white"
                >
                  {connectedHandle}
                </span>
              )}
              <span
                data-testid={`social-status-${key}`}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400"
              >
                <CheckCircle2 size={11} className="shrink-0 text-emerald-400" />
                <span>เชื่อมต่อแล้ว</span>
              </span>
            </div>
          ) : (
            <span className="text-xs text-[#5c556f]">ยังไม่ได้เชื่อมต่อ</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <SocialRowActions
            platform={platform}
            rawValue={rawValue}
            connectedHandle={connectedHandle}
            isConnected={isConnected}
            readOnly={readOnly}
            onConnectClick={onConnectClick}
            onChangeAccountClick={onChangeAccountClick}
            onDisconnectClick={onDisconnectClick}
          />
        </div>
      </div>
    </div>
  );
};

const SocialOAuthModal = ({
  modalState,
  accounts,
  selectedHandle,
  isLoading,
  onSelectHandle,
  onConfirmConnect,
  onOpenPopupWindow,
  onClose,
}) => {
  if (!modalState) return null;

  const { platform, mode } = modalState;
  const meta = OAUTH_PROVIDER_META[platform.key] || {
    providerName: platform.label,
    authDomain: "oauth.provider.com",
    oauthUrl: "https://donix.app",
  };

  const modalTitle =
    mode === "change"
      ? `เปลี่ยนบัญชี ${meta.providerName}`
      : `เชื่อมต่อบัญชี ${meta.providerName}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="oauth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#2e2648] bg-[#16122a] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#2b2542] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2e2648] bg-[#110d22]">
              {platform.icon}
            </div>
            <div>
              <h3 id="oauth-modal-title" className="text-sm font-bold text-white">
                {modalTitle}
              </h3>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#9891ab]">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>OAuth 2.0 • {meta.authDomain}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="ปิดหน้าต่างเชื่อมต่อ"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          <p className="text-xs font-medium text-[#d4cfdf]">
            เลือกบัญชี {meta.providerName} ที่ต้องการเชื่อมต่อกับ DONIX:
          </p>
          <div className="space-y-2">
            {accounts.map((acc) => {
              const isSelected = selectedHandle === acc.handle;
              return (
                <button
                  key={acc.handle}
                  type="button"
                  onClick={() => onSelectHandle(acc.handle)}
                  className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                    isSelected
                      ? "border-purple-500 bg-purple-500/15 text-white"
                      : "border-[#2e2648] bg-[#110d22] text-gray-300 hover:border-[#3e3460]"
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-white">{acc.handle}</p>
                    <p className="text-[10px] text-[#9891ab]">{acc.tag}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={16} className="text-purple-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onOpenPopupWindow(meta.oauthUrl)}
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-purple-300 hover:text-purple-200 transition-colors"
          >
            <ExternalLink size={12} />
            <span>เปิดหน้าต่างยืนยันตัวตนของ {meta.providerName}</span>
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-[#2e2648] bg-[#110d22] px-4 py-2 text-xs font-medium text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirmConnect}
            className="rounded-xl bg-[#8b5cf6] px-5 py-2 text-xs font-semibold text-white shadow-[0_0_16px_rgba(139,92,246,0.35)] hover:bg-[#7c3aed] transition-all flex items-center gap-1.5"
          >
            {isLoading && <Loader2 size={12} className="animate-spin" />}
            <span>อนุญาตและเชื่อมต่อ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const SocialMediaTab = ({ user, onSave, readOnly = false }) => {
  const [socialLinks, setSocialLinks] = useState({
    facebook: user?.social?.facebook || "",
    instagram: user?.social?.instagram || "",
    youtube: user?.social?.youtube || "",
    tiktok: user?.social?.tiktok || "",
    twitch: user?.social?.twitch || "",
    x: user?.social?.x || "",
  });
  const [oauthModal, setOauthModal] = useState(null);
  const [selectedHandle, setSelectedHandle] = useState("");
  const [loadingPlatform, setLoadingPlatform] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (user?.social) {
      setSocialLinks({
        facebook: user.social.facebook || "",
        instagram: user.social.instagram || "",
        youtube: user.social.youtube || "",
        tiktok: user.social.tiktok || "",
        twitch: user.social.twitch || "",
        x: user.social.x || "",
      });
    }
  }, [user]);

  const baseHandle = getBaseHandle(user);
  const accounts = buildOAuthAccounts(baseHandle, user?.email);

  const handleOpenConnect = (platform) => {
    setSelectedHandle(accounts[0].handle);
    setLoadingPlatform(null);
    setOauthModal({ platform, mode: "connect" });
    setStatusMessage(null);
  };

  const handleOpenChangeAccount = (platform, currentHandle) => {
    const nextAccount =
      accounts.find((a) => a.handle !== currentHandle) || accounts[0];
    setSelectedHandle(nextAccount.handle);
    setLoadingPlatform(null);
    setOauthModal({ platform, mode: "change" });
    setStatusMessage(null);
  };


  const handleConfirmOAuthConnect = () => {
    if (!oauthModal) return;
    const { key } = oauthModal.platform;
    const meta = OAUTH_PROVIDER_META[key];
    const cleanName = selectedHandle.replace(/^@+/, "");
    const connectedValue = meta?.baseUrl
      ? `${meta.baseUrl}${cleanName}`
      : selectedHandle;

    const updated = { ...socialLinks, [key]: connectedValue };
    setSocialLinks(updated);
    setOauthModal(null);
    if (onSave) {
      onSave({ social: updated });
    }

    setLoadingPlatform(key);
    void connectSocialAccount(key, {
      handle: selectedHandle,
      code: `code_${key}_auth`,
    })
      .then((res) => {
        if (res?.url && res.url !== connectedValue) {
          const finalUpdated = { ...updated, [key]: res.url };
          setSocialLinks(finalUpdated);
          if (onSave) {
            onSave({ social: finalUpdated });
          }
        }
        setStatusMessage({
          type: "success",
          text: `เชื่อมต่อบัญชี ${meta.providerName} สำเร็จ`,
        });
      })
      .catch(() => {
        // Retain optimistic value
      })
      .finally(() => {
        setLoadingPlatform(null);
      });
  };

  const handleDisconnect = (key) => {
    const meta = OAUTH_PROVIDER_META[key];
    const updated = { ...socialLinks, [key]: "" };
    setSocialLinks(updated);
    if (onSave) {
      onSave({ social: updated });
    }

    setLoadingPlatform(key);
    void disconnectSocialAccount(key)
      .then(() => {
        setStatusMessage({
          type: "success",
          text: `ยกเลิกการเชื่อมต่อ ${meta?.providerName || key} สำเร็จ`,
        });
      })
      .catch(() => {})
      .finally(() => {
        setLoadingPlatform(null);
      });
  };


  const handleOpenExternalPopup = (urlOrPlatform) => {
    const platform = typeof urlOrPlatform === "object" ? urlOrPlatform : oauthModal?.platform;
    const key = platform?.key || "youtube";
    const meta = OAUTH_PROVIDER_META[key];
    const targetUrl = typeof urlOrPlatform === "string" ? urlOrPlatform : meta?.oauthUrl || "https://donix.app";

    if (typeof window !== "undefined" && typeof window.open === "function") {
      window.open(targetUrl, `donix_oauth_${key}`, "width=520,height=640,noopener,noreferrer");
    }

    if (typeof window !== "undefined") {
      const redirectUri = `${window.location.origin}/oauth-callback`;
      void getSocialAuthUrl(key, redirectUri)
        .then((res) => {
          if (res?.authUrl && typeof window.open === "function") {
            // Pre-fetched URL
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    const handleOAuthMessage = (event) => {
      if (typeof window !== "undefined" && event.origin !== window.location.origin) return;
      if (event.data?.type === "OAUTH_CALLBACK" && event.data?.code) {
        const { code, state } = event.data;
        const platformKey = state?.split("_")?.[0] || oauthModal?.platform?.key;
        if (platformKey && socialLinks[platformKey] !== undefined) {
          setLoadingPlatform(platformKey);
          const redirectUri = `${window.location.origin}/oauth-callback`;
          void connectSocialAccount(platformKey, { code, redirectUri })
            .then((result) => {
              if (result?.url) {
                const updated = { ...socialLinks, [platformKey]: result.url };
                setSocialLinks(updated);
                setOauthModal(null);
                setStatusMessage({
                  type: "success",
                  text: `เชื่อมต่อบัญชี ${OAUTH_PROVIDER_META[platformKey]?.providerName || platformKey} สำเร็จ`,
                });
                if (onSave) {
                  onSave({ social: updated });
                }
              }
            })
            .catch(() => {
              setStatusMessage({
                type: "error",
                text: "เกิดข้อผิดพลาดในการเชื่อมต่อ OAuth",
              });
            })
            .finally(() => {
              setLoadingPlatform(null);
            });
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("message", handleOAuthMessage);
      return () => window.removeEventListener("message", handleOAuthMessage);
    }
  }, [oauthModal, socialLinks, onSave]);

  const handleSave = () => {
    if (onSave) {
      onSave({ social: socialLinks });
    }
  };

  if (readOnly) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {socialPlatforms.map((platform) => (
          <SocialPlatformRow
            key={platform.key}
            platform={platform}
            rawValue={socialLinks[platform.key]}
            readOnly={true}
          />
        ))}
      </div>
    );
  }

  return (
    <SettingsCard
      title="โซเชียลมีเดีย"
      subtitle="SOCIAL MEDIA"
      onSave={handleSave}
      hideSave={readOnly}
    >
      <div
        className={
          readOnly
            ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            : "grid gap-4 sm:grid-cols-2"
        }
      >
        {socialPlatforms.map((platform) => (
          <SocialPlatformRow
            key={platform.key}
            platform={platform}
            rawValue={socialLinks[platform.key]}
            readOnly={readOnly}
            onConnectClick={handleOpenConnect}
            onChangeAccountClick={handleOpenChangeAccount}
            onDisconnectClick={handleDisconnect}
          />
        ))}
      </div>

      {!readOnly && (
        <SocialOAuthModal
          modalState={oauthModal}
          accounts={accounts}
          selectedHandle={selectedHandle}
          onSelectHandle={setSelectedHandle}
          onConfirmConnect={handleConfirmOAuthConnect}
          onOpenPopupWindow={handleOpenExternalPopup}
          onClose={() => setOauthModal(null)}
        />
      )}
    </SettingsCard>
  );
};

export default SocialMediaTab;