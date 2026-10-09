/**
 * โมดูลจัดการระบบเสียงแจ้งเตือน (Sound Presets / Custom Audio)
 * และระบบอ่านออกเสียงอัตโนมัติ (Text-to-Speech) สำหรับ OBS Overlay Alert
 */

let activeTtsAudio = null;
let cachedVoices = [];

// พรีโหลด Voice ของเบราว์เซอร์ทันทีเมื่อโมดูลถูกโหลด
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  cachedVoices = window.speechSynthesis.getVoices() || [];
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  });
}

/**
 * ดึงรายการ Voice ของเบราว์เซอร์แบบ Asynchronous เพื่อรองรับ Chromium ที่โหลด Voice ช้า
 */
export const getAvailableVoices = () => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve([]);
  }

  const immediate = window.speechSynthesis.getVoices() || [];
  if (immediate.length > 0) {
    cachedVoices = immediate;
    return Promise.resolve(immediate);
  }

  if (cachedVoices.length > 0) {
    return Promise.resolve(cachedVoices);
  }

  return new Promise((resolve) => {
    let resolved = false;
    const onVoices = () => {
      if (resolved) return;
      const v = window.speechSynthesis.getVoices() || [];
      if (v.length > 0) {
        resolved = true;
        cachedVoices = v;
        window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
        resolve(v);
      }
    };

    window.speechSynthesis.addEventListener("voiceschanged", onVoices);

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cachedVoices = window.speechSynthesis.getVoices() || [];
        resolve(cachedVoices);
      }
    }, 800);
  });
};

/**
 * เล่นไฟล์เสียง Custom ที่อัปโหลด
 */
const playCustomSound = (customSoundFile, normalizedVolume) => {
  if (!customSoundFile) return;
  try {
    const cached =
      (typeof window !== "undefined" && window._donixCustomAudioMap?.[customSoundFile]) ||
      (typeof localStorage !== "undefined" && localStorage.getItem("donix_audio_" + customSoundFile)) ||
      customSoundFile;
    const audio = new Audio(cached);
    audio.volume = normalizedVolume;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  } catch {
    // หากไฟล์เสียง custom ผิดพลาด จะไม่ขัดจังหวะระบบ
  }
};

/**
 * จำลองเสียง Synth ผ่าน Web Audio API
 */
const playSynthPreset = (preset, normalizedVolume) => {
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
 * เล่นเสียงแจ้งเตือนตาม Preset หรือไฟล์เสียงแบบกำหนดเอง (Custom)
 * @param {Object} options
 * @param {string} options.preset - 'mythic-horn' | 'dragon-roar' | 'ancient-bell' | 'custom' | 'none'
 * @param {number} [options.volume=80] - ระดับเสียง 0 - 100
 * @param {string} [options.customSoundFile] - Base64 หรือ URL ของไฟล์เสียง
 */
export const playAlertSound = ({ preset = "mythic-horn", volume = 80, customSoundFile = null }) => {
  if (preset === "none") return;

  const normalizedVolume = Math.max(0, Math.min(100, Number(volume) || 80)) / 100;

  if (preset === "custom") {
    playCustomSound(customSoundFile, normalizedVolume);
    return;
  }

  playSynthPreset(preset, normalizedVolume);
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
      utterance.pitch = 0.72; // เสียงทุ้มต่ำแบบผู้ชาย (สมชาย)
    } else {
      utterance.pitch = 1.25; // เสียงหวานใสแบบผู้หญิง (สิริพร)
    }

    window.speechSynthesis.speak(utterance);

  } catch {
    // ป้องกันข้อผิดพลาด
  }
};

/**
 * ค้นหา Voice ในเบราว์เซอร์ที่ตรงกับภาษา
 */
const findMatchingVoice = (availableVoices, isThai) => {
  if (isThai) {
    return availableVoices.find(
      (v) =>
        v.lang?.toLowerCase().includes("th") ||
        v.name?.toLowerCase().includes("thai") ||
        v.name?.includes("ไทย")
    );
  }
  return availableVoices.find((v) => v.lang?.toLowerCase().includes("en"));
};

/**
 * สตรีมเสียงสังเคราะห์ผ่าน Google TTS HTTPS
 */
const streamGoogleTts = async (cleanText, isMale, normalizedVolume, parsedSpeed) => {
  const streamUrl = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=th&q=${encodeURIComponent(cleanText.slice(0, 200))}`;
  try {
    const audio =
      typeof document !== "undefined"
        ? document.createElement("audio")
        : new Audio(streamUrl);
    audio.referrerPolicy = "no-referrer";
    audio.src = streamUrl;
    audio.volume = normalizedVolume;

    if ("preservesPitch" in audio) {
      audio.preservesPitch = !isMale;
    }
    audio.playbackRate = isMale
      ? Math.max(0.65, Math.min(1.3, parsedSpeed * 0.8))
      : Math.max(0.75, Math.min(1.5, parsedSpeed * 1.02));

    activeTtsAudio = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      await playPromise.catch(() => {});
    }
  } catch {
    // หากเล่นเสียงไม่สำเร็จ ให้ข้ามไป
  }
};

/**
 * อ่านออกเสียงข้อความแจ้งเตือนด้วย Text-to-Speech (TTS)
 * ลำดับการทำงาน:
 * 1. ดึงเสียงสังเคราะห์ผ่าน Web Speech API เฉพาะกรณีที่มี Voice ภาษาไทยจริง
 * 2. หรือสตรีมผ่าน Google TTS HTTPS Direct (พร้อม no-referrer)
 *
 * @param {Object} options
 * @param {string} options.text - ข้อความที่ต้องการอ่าน
 * @param {string} [options.voice='th-female'] - 'th-female' | 'th-male' | 'en-female' | 'en-male'
 * @param {number} [options.volume=80] - ระดับเสียง 0 - 100
 * @param {string|number} [options.speed='1.0x'] - ความเร็ว '0.5x' ถึง '2.0x'
 */
export const speakAlertText = async ({
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
  const parsedSpeed = typeof speed === "number" ? speed : Number.parseFloat(String(speed).replace("x", "")) || 1.0;
  const isThai = voice.startsWith("th");

  // 1. ตรวจสอบว่าในเบราว์เซอร์มีเสียงสังเคราะห์ที่ตรงกับภาษาหรือไม่
  const availableVoices = await getAvailableVoices();
  const matchedVoice = findMatchingVoice(availableVoices, isThai);

  // 2. หากพบ Voice ในเบราว์เซอร์ ให้ใช้ Web Speech API ได้เลย
  if (matchedVoice) {
    fallbackWebSpeech(
      cleanText,
      isThai ? "th-TH" : "en-US",
      normalizedVolume,
      parsedSpeed,
      matchedVoice,
      voice
    );
    return;
  }

  // 3. หากเป็นภาษาไทยแต่เครื่องไม่มี Voice ภาษาไทย ให้เล่นผ่าน Google TTS HTTPS Stream
  if (isThai) {
    await streamGoogleTts(cleanText, voice === "th-male", normalizedVolume, parsedSpeed);
    return;
  }

  // 4. กรณีเลือกเสียงภาษาอังกฤษ (en-female / en-male)
  fallbackWebSpeech(cleanText, "en-US", normalizedVolume, parsedSpeed, matchedVoice, voice);
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
