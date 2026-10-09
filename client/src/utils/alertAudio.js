/**
 * โมดูลจัดการระบบเสียงแจ้งเตือน (Sound Presets / Custom Audio)
 * และระบบอ่านออกเสียงอัตโนมัติ (Text-to-Speech) สำหรับ OBS Overlay Alert
 */

/**
 * เล่นเสียงแจ้งเตือนตาม Preset หรือไฟล์เสียงแบบกำหนดเอง (Custom)
 * @param {Object} options
 * @param {string} options.preset - 'mythic-horn' | 'dragon-roar' | 'ancient-bell' | 'custom' | 'none'
 * @param {number} [options.volume=80] - ระดับเสียง 0 - 100
 * @param {string} [options.customSoundFile] - Base64 หรือ URL ของไฟล์เสียง
 */
export const playAlertSound = ({ preset = "mythic-horn", volume = 80, customSoundFile = null }) => {
  if (preset === "none") return;

  const normalizedVolume = Math.max(0, Math.min(100, Number(volume) || 80)) / 100;

  // กรณีเลือกเล่นไฟล์เสียง Custom ที่สตรีมเมอร์อัปโหลด
  if (preset === "custom" && customSoundFile) {
    try {
      const audio = new Audio(customSoundFile);
      audio.volume = normalizedVolume;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // จัดการกรณี Browser Autoplay Policy ป้องกันไม่ให้แครช
        });
      }
      return;
    } catch {
      // หากไฟล์เสียง custom ผิดพลาด จะไม่ขัดจังหวะระบบ
    }
  }

  // จำลองเสียง Presets ผ่าน Web Audio API (ความเข้ากันได้สูง ไม่ต้องโหลดไฟล์ MP3 ภายนอก)
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const baseGain = normalizedVolume * 0.4;

    if (preset === "dragon-roar") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.2);
      gain.gain.setValueAtTime(baseGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } else if (preset === "ancient-bell") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(baseGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
      osc.start();
      osc.stop(ctx.currentTime + 2.0);
    } else {
      // ค่าเริ่มต้น: Mythic Horn
      osc.type = "triangle";
      osc.frequency.setValueAtTime(392.0, ctx.currentTime);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(baseGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    }
  } catch {
    // ป้องกันข้อผิดพลาดเกี่ยวกับ Web Audio API
  }
};

/**
 * อ่านออกเสียงข้อความแจ้งเตือนด้วย Text-to-Speech (TTS)
 * @param {Object} options
 * @param {string} options.text - ข้อความที่ต้องการอ่าน
 * @param {string} [options.voice='th-female'] - 'th-female' | 'th-male' | 'en-female' | 'en-male'
 * @param {number} [options.volume=80] - ระดับเสียง 0 - 100
 * @param {string|number} [options.speed='1.0x'] - ความเร็ว '0.5x' ถึง '2.0x'
 */
export const speakAlertText = ({
  text,
  voice = "th-female",
  volume = 80,
  speed = "1.0x",
}) => {
  if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  try {
    // ยกเลิกข้อความค้างเดิมก่อนหน้าเพื่อไม่ให้เสียงพูดทับซ้อน
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const parsedSpeed = typeof speed === "number" ? speed : parseFloat(String(speed).replace("x", "")) || 1.0;
    utterance.rate = Math.max(0.5, Math.min(2.0, parsedSpeed));
    utterance.volume = Math.max(0, Math.min(100, Number(volume) || 80)) / 100;

    // เลือกภาษาและระดับเสียงตาม Preset
    const isThai = voice.startsWith("th");
    utterance.lang = isThai ? "th-TH" : "en-US";

    if (voice === "th-male" || voice === "en-male") {
      utterance.pitch = 0.85;
    } else {
      utterance.pitch = 1.15;
    }

    const availableVoices = window.speechSynthesis.getVoices?.() || [];
    const matchedVoice = availableVoices.find((v) =>
      isThai ? v.lang.includes("th") : v.lang.includes("en")
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    // ป้องกันข้อผิดพลาด TTS
  }
};

/**
 * หยุดเสียงแจ้งเตือนและเสียงพูดทั้งหมด
 */
export const stopAllAlertAudio = () => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ละเว้นข้อผิดพลาด
    }
  }
};
