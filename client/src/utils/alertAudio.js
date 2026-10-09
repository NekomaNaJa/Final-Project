/**
 * โมดูลจัดการระบบเสียงแจ้งเตือน (Sound Presets / Custom Audio)
 * และระบบอ่านออกเสียงอัตโนมัติ (Text-to-Speech) สำหรับ OBS Overlay Alert
 */

let activeTtsAudio = null;

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
 * รองรับทั้ง Web Speech API ในเบราว์เซอร์ และ Google TTS Audio Fallback เมื่อเครื่องผู้ใช้ไม่มีเสียงภาษาไทย
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
  if (!text || typeof text !== "string" || !text.trim() || typeof window === "undefined") {
    return;
  }

  // หยุดเสียงเดิมที่กำลังพูดอยู่ก่อนหน้า
  stopAllAlertAudio();

  const cleanText = text.replace(/["'*:;]/g, " ").trim();
  const normalizedVolume = Math.max(0, Math.min(100, Number(volume) || 80)) / 100;
  const parsedSpeed = typeof speed === "number" ? speed : parseFloat(String(speed).replace("x", "")) || 1.0;
  const isThai = voice.startsWith("th");

  // ตรวจสอบว่าในระบบเบราว์เซอร์มีเสียงสังเคราะห์ภาษาไทยหรือไม่
  let matchedThaiVoice = null;
  if ("speechSynthesis" in window) {
    const availableVoices = window.speechSynthesis.getVoices?.() || [];
    matchedThaiVoice = availableVoices.find(
      (v) =>
        v.lang?.toLowerCase().includes("th") ||
        v.name?.toLowerCase().includes("thai") ||
        v.name?.includes("ไทย")
    );
  }

  // กรณีเป็นภาษาไทย แต่เครื่องผู้ใช้ไม่มี Voice ภาษาไทยติดตั้ง (เช่น Windows ค่าเริ่มต้นที่ไม่มี Thai Speech Pack)
  // ให้สตรีมเสียงสังเคราะห์ภาษาไทยมาตรฐานผ่าน Google TTS เพื่อให้อ่านภาษาไทยและข้อความโดเนทได้อย่างแม่นยำ 100%
  if (isThai && !matchedThaiVoice) {
    try {
      const encodedText = encodeURIComponent(cleanText.slice(0, 200));
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=th&client=tw-ob&q=${encodedText}`;
      const audio = new Audio(ttsUrl);
      audio.volume = normalizedVolume;
      audio.playbackRate = Math.max(0.75, Math.min(1.5, parsedSpeed));
      activeTtsAudio = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // หากติดข้อจำกัดด้านเครือข่าย ให้พยายามลอง Web Speech API แทน
          fallbackWebSpeech(cleanText, "th-TH", normalizedVolume, parsedSpeed, null);
        });
      }
      return;
    } catch {
      // หากเกิดข้อผิดพลาด ให้สลับไป Web Speech API
    }
  }

  // กรณีมีเสียงภาษาไทย หรือเป็นเสียงภาษาอังกฤษ ให้ใช้ Web Speech API ตามปกติ
  if ("speechSynthesis" in window) {
    const lang = isThai ? "th-TH" : "en-US";
    const availableVoices = window.speechSynthesis.getVoices?.() || [];
    const matchedVoice = isThai
      ? matchedThaiVoice
      : availableVoices.find((v) => v.lang?.toLowerCase().includes("en"));

    fallbackWebSpeech(cleanText, lang, normalizedVolume, parsedSpeed, matchedVoice, voice);
  }
};

/**
 * ผู้ช่วยสังเคราะห์เสียงผ่าน Web Speech API
 */
const fallbackWebSpeech = (text, lang, volume, speed, voiceObj, voicePreset = "") => {
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.volume = volume;
    utterance.rate = Math.max(0.5, Math.min(2.0, speed));

    if (voiceObj) {
      utterance.voice = voiceObj;
    }

    if (voicePreset.includes("male") && !voicePreset.includes("female")) {
      utterance.pitch = 0.85;
    } else {
      utterance.pitch = 1.15;
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    // ป้องกันข้อผิดพลาด
  }
};

/**
 * หยุดเสียงแจ้งเตือนและเสียงพูดทั้งหมด
 */
export const stopAllAlertAudio = () => {
  if (activeTtsAudio) {
    try {
      if (typeof activeTtsAudio.pause === "function") {
        activeTtsAudio.pause();
      }
      activeTtsAudio.currentTime = 0;
    } catch {
      // ละเว้นข้อผิดพลาด
    }
    activeTtsAudio = null;
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ละเว้นข้อผิดพลาด
    }
  }
};
