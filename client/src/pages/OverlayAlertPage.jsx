import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Bell, Sparkles } from "lucide-react";
import { DEFAULT_WIDGET_CONFIG, getWidgetConfig } from "../components/Widget/widgetStorage";
import { API_URL } from "../utils/api";
import {
  playAlertSound,
  speakAlertText,
  stopAllAlertAudio,
} from "../utils/alertAudio";

const SAMPLE_ALERTS = [
  {
    donorName: "ผู้สนับสนุนใจดี",
    amount: 100,
    message: "เป็นกำลังใจให้ครับ สตรีมสนุกมาก!",
  },
  {
    donorName: "แฟนคลับเบอร์หนึ่ง",
    amount: 500,
    message: "ขอเพลงโปรดหน่อยครับ เล่นเกมเก่งมาก!",
  },
  {
    donorName: "สายเปย์ประจำช่อง",
    amount: 1000,
    message: "เติมพลังให้สตรีมเมอร์ สู้ๆ ครับผม ❤️",
  },
];

const OverlayAlertPage = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get("demo") === "1" || searchParams.get("test") === "1";

  const [config, setConfig] = useState(() => {
    try {
      return getWidgetConfig().alert;
    } catch {
      return DEFAULT_WIDGET_CONFIG.alert;
    }
  });
  const [currentAlert, setCurrentAlert] = useState(null);
  const [stage, setStage] = useState("idle"); // "idle" | "entering" | "visible" | "exiting"

  const activeTimersRef = useRef([]);

  // รับการอัปเดตการตั้งค่าจาก WidgetPage ทันทีเมื่อมีการบันทึก
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "donix_widget_config") {
        try {
          const updated = getWidgetConfig().alert;
          setConfig((prev) => ({ ...prev, ...updated }));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const clearTimers = useCallback(() => {
    activeTimersRef.current.forEach((t) => window.clearTimeout(t));
    activeTimersRef.current = [];
    stopAllAlertAudio();
  }, []);

  // ทำให้พื้นหลังของเอกสารโปร่งใสสำหรับ OBS Studio Browser Source
  useEffect(() => {
    const originalBodyBg = document.body.style.backgroundColor;
    const originalHtmlBg = document.documentElement.style.backgroundColor;

    document.body.style.backgroundColor = "transparent";
    document.documentElement.style.backgroundColor = "transparent";

    return () => {
      document.body.style.backgroundColor = originalBodyBg;
      document.documentElement.style.backgroundColor = originalHtmlBg;
      clearTimers();
      stopAllAlertAudio();
    };
  }, [clearTimers]);

  // ดึงการตั้งค่าจากเซิร์ฟเวอร์ (ถ้ามี token) หรือใช้ค่าเริ่มต้น
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const fetchOverlayConfig = async () => {
      try {
        const safeToken = encodeURIComponent(String(token).trim());
        const response = await fetch(`${API_URL}/public/overlay/alert/${safeToken}`);
        if (!response.ok) return;

        const result = await response.json();
        if (isMounted && result?.data?.alert) {
          setConfig((prev) => ({ ...prev, ...result.data.alert }));
        }
      } catch {
        // หากเชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ให้ใช้ค่าเริ่มต้นต่อไป
      }
    };

    fetchOverlayConfig();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // ฟังก์ชันจำลองการแสดงแจ้งเตือนพร้อม Animation Lifecycle และเสียง/TTS
  const triggerAlert = useCallback(
    (alertData, customConfig = null) => {
      clearTimers();
      const activeCfg = customConfig || config;

      setCurrentAlert(alertData);
      setStage("entering");

      // 1. เล่นเสียงแจ้งเตือน (Preset Sound, Amount Tier Sound, หรือ Custom File)
      let soundPreset = activeCfg.soundPreset || "mythic-horn";
      const amount = Number(alertData?.amount) || 0;
      if (activeCfg.useAmountTiers && Array.isArray(activeCfg.amountTiers)) {
        const matchedTier = activeCfg.amountTiers.find(
          (t) => amount >= Number(t.min) && amount <= Number(t.max)
        );
        if (matchedTier?.sound) {
          soundPreset = matchedTier.sound;
        }
      }

      playAlertSound({
        preset: soundPreset,
        volume: activeCfg.volume,
        customSoundFile: activeCfg.customSoundFile,
      });

      // 2. อ่านออกเสียงข้อความด้วย TTS (Text-to-Speech)
      let ttsTimer = null;
      if (activeCfg.ttsEnabled) {
        const donor = alertData?.donorName || "ผู้สนับสนุน";
        const donationAmount = alertData?.amount || 0;
        const msg = alertData?.message ? ` ข้อความ ${alertData.message}` : "";
        const ttsText = `${donor} โดเนท ${donationAmount} บาท${msg}`;

        ttsTimer = window.setTimeout(() => {
          speakAlertText({
            text: ttsText,
            voice: activeCfg.ttsVoice,
            volume: activeCfg.ttsVolume,
            speed: activeCfg.ttsSpeed,
          });
        }, 500);
      }

      const durInMs = Math.max(100, (activeCfg.durationIn || 0.8) * 1000);
      const durDisplayMs = Math.max(500, (activeCfg.durationDisplay || 5) * 1000);
      const durOutMs = Math.max(100, (activeCfg.durationOut || 0.8) * 1000);

      // Phase 1: เข้าสู่สเตจแสดงผลค้างไว้ (visible)
      const t1 = window.setTimeout(() => {
        setStage("visible");
      }, durInMs);

      // Phase 2: เริ่มแอนิเมชันเลือนออก (exiting)
      const t2 = window.setTimeout(() => {
        setStage("exiting");
      }, durInMs + durDisplayMs);

      // Phase 3: สิ้นสุด กลับสู่สถานะว่าง (idle)
      const t3 = window.setTimeout(() => {
        setStage("idle");
        setCurrentAlert(null);
      }, durInMs + durDisplayMs + durOutMs);

      activeTimersRef.current = [t1, t2, t3, ...(ttsTimer ? [ttsTimer] : [])];
    },
    [clearTimers, config]
  );

  // ถ้าเปิดในโหมด demo ให้ยิงการแจ้งเตือนตัวอย่างอัตโนมัติ 1 ครั้ง
  useEffect(() => {
    if (isDemoMode) {
      triggerAlert(SAMPLE_ALERTS[0]);
    }
    return () => {
      clearTimers();
    };
  }, [isDemoMode, triggerAlert, clearTimers]);

  // เลือกรูปภาพตาม Amount Tiers (หากเปิดใช้งาน) หรือรูปหลัก
  const activeImage = useMemo(() => {
    const amount = Number(currentAlert?.amount) || 0;
    if (config.useAmountTiers && Array.isArray(config.amountTiers)) {
      const matched = config.amountTiers.find(
        (t) => amount >= Number(t.min) && amount <= Number(t.max)
      );
      if (matched?.image) {
        return matched.image;
      }
    }
    return config.overlayImage || null;
  }, [config.useAmountTiers, config.amountTiers, config.overlayImage, currentAlert?.amount]);

  // คลาสแอนิเมชัน In / Out ตาม Preset
  const animationClass = useMemo(() => {
    if (stage === "entering") {
      return `anim-${config.animationIn || "bounceIn"}`;
    }
    if (stage === "exiting") {
      return `anim-${config.animationOut || "fadeOut"}`;
    }
    return "";
  }, [stage, config.animationIn, config.animationOut]);

  // เวลาแอนิเมชันแบบ Dynamic Duration
  const animationStyle = useMemo(() => {
    if (stage === "entering") {
      return { animationDuration: `${config.durationIn || 0.8}s` };
    }
    if (stage === "exiting") {
      return { animationDuration: `${config.durationOut || 0.8}s` };
    }
    return {};
  }, [stage, config.durationIn, config.durationOut]);

  // คลาสเอฟเฟกต์ตามการตั้งค่า (Glow, Pulse, Shake, Glitch, Wave)
  const filterClass = useMemo(() => {
    switch (config.filterEffect) {
      case "Shake":
        return "animate-bounce";
      case "Pulse":
        return "animate-pulse";
      case "Glow":
        return "drop-shadow-[0_0_24px_rgba(192,132,252,0.95)]";
      case "Glitch":
        return "skew-x-2 filter drop-shadow-[3px_3px_0px_#f43f5e]";
      case "Wave":
        return "animate-pulse";
      default:
        return "";
    }
  }, [config.filterEffect]);

  // ตัดคำใน Template ({user}, {amount})
  const templateParts = useMemo(() => {
    const tpl = config.template || "{user} โดเนท {amount} บาท";
    return tpl.split(/(\{user\}|\{amount\})/g);
  }, [config.template]);

  // ขอบตัวหนังสือ (Text Stroke)
  const strokeStyle = useMemo(() => {
    if (!config.strokeSize) return {};
    return {
      WebkitTextStroke: `${config.strokeSize}px ${config.strokeColor || "#000000"}`,
    };
  }, [config.strokeSize, config.strokeColor]);

  const activeDonor = currentAlert?.donorName || "ผู้สนับสนุนใจดี";
  const activeAmount = currentAlert?.amount || 100;
  const isDisplaying = stage !== "idle";

  return (
    <div
      data-testid="overlay-alert-container"
      className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-transparent p-4 select-none"
    >
      {/* Alert Card แสดงผลเมื่อมีรายการแจ้งเตือน */}
      {isDisplaying && (
        <section
          data-testid="alert-display-card"
          data-stage={stage}
          style={animationStyle}
          className={`flex flex-col items-center justify-center text-center transition-all ${animationClass}`}
        >
          {/* รูปภาพ Overlay หรือไอคอนกระดิ่ง */}
          {activeImage ? (
            <img
              src={activeImage}
              alt="Alert Overlay"
              className="mb-3 max-h-40 max-w-40 rounded-2xl object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
            />
          ) : (
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl border border-purple-500/50 bg-[#16122a]/95 text-purple-300 shadow-[0_0_40px_rgba(168,85,247,0.5)] backdrop-blur-md">
              <Bell size={40} className="animate-bounce" />
            </div>
          )}

          {/* ข้อความหัวเรื่องการโดเนท (Template) */}
          <div
            className={`transition-all ${filterClass}`}
            style={{
              fontFamily: config.fontFamily || "Kanit",
              fontWeight: config.fontWeight || "700",
              fontSize: `${config.fontSize || 32}px`,
              color: config.textColor || "#ffffff",
              ...strokeStyle,
            }}
          >
            <p className="leading-snug">
              {templateParts.map((part, idx) => {
                if (part === "{user}") {
                  return (
                    <span
                      key={idx}
                      style={{ color: config.userNameColor || "#c084fc" }}
                      className="font-bold"
                    >
                      {activeDonor}
                    </span>
                  );
                }
                if (part === "{amount}") {
                  return (
                    <span
                      key={idx}
                      style={{ color: config.amountColor || "#fbbf24" }}
                      className="font-bold"
                    >
                      {Number(activeAmount).toLocaleString()}
                    </span>
                  );
                }
                return <span key={idx}>{part}</span>;
              })}
            </p>
          </div>

          {/* เอฟเฟกต์ประกาย (Shine Effect) */}
          {config.shineEffect && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-extrabold text-amber-300 drop-shadow-md">
              <Sparkles size={14} className="animate-spin" />
              <span>✨ DONATION ALERT ✨</span>
              <Sparkles size={14} className="animate-spin" />
            </div>
          )}

          {/* ข้อความโดเนทจากผู้สนับสนุน (ถ้ามี) */}
          {currentAlert?.message && (
            <div className="mt-4 max-w-lg rounded-2xl border border-white/10 bg-[#0f0d1b]/95 px-6 py-3.5 text-base font-medium text-white/95 shadow-2xl backdrop-blur-md">
              <p className="break-words leading-relaxed">
                "{currentAlert.message}"
              </p>
            </div>
          )}
        </section>
      )}

      {/* แถบเครื่องมือจำลองการแจ้งเตือน (แสดงเฉพาะเมื่อดูบนเบราว์เซอร์ปกติหรือทดสอบ) */}
      <footer
        data-testid="overlay-test-controls"
        className="pointer-events-auto fixed bottom-4 right-4 flex items-center gap-2 rounded-xl border border-white/10 bg-[#120f24]/85 p-2 text-xs text-white shadow-xl backdrop-blur-md opacity-40 hover:opacity-100 transition-opacity"
      >
        <span className="text-[11px] text-purple-300">
          OBS Alert {stage !== "idle" ? `(${stage})` : ""}
        </span>
        <button
          type="button"
          onClick={() => {
            const randomIndex = Math.floor(Math.random() * SAMPLE_ALERTS.length);
            triggerAlert(SAMPLE_ALERTS[randomIndex]);
          }}
          className="rounded-lg bg-purple-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-purple-500 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          ทดสอบแจ้งเตือน
        </button>
      </footer>
    </div>
  );
};

export default OverlayAlertPage;
