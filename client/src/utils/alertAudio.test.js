import {
  playAlertSound,
  speakAlertText,
  stopAllAlertAudio,
  getAvailableVoices,
} from "./alertAudio";

describe("alertAudio Utility", () => {
  let originalAudioContext;
  let originalAudio;
  let originalSpeechSynthesis;
  let originalPlay;

  let mockOscillator;
  let mockGain;
  let mockContext;
  let mockAudioInstance;
  let mockUtteranceInstance;

  beforeEach(() => {
    originalAudioContext = window.AudioContext;
    originalAudio = window.Audio;
    originalSpeechSynthesis = window.speechSynthesis;
    originalPlay = window.HTMLMediaElement?.prototype?.play;

    if (window.HTMLMediaElement) {
      window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
    }

    mockOscillator = {
      connect: jest.fn(),
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
    };

    mockGain = {
      connect: jest.fn(),
      gain: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
    };

    mockContext = {
      currentTime: 0,
      destination: {},
      createOscillator: jest.fn(() => mockOscillator),
      createGain: jest.fn(() => mockGain),
    };

    window.AudioContext = jest.fn(() => mockContext);

    mockAudioInstance = {
      volume: 1,
      play: jest.fn().mockResolvedValue(undefined),
    };
    window.Audio = jest.fn(() => mockAudioInstance);

    window.speechSynthesis = {
      speak: jest.fn(),
      cancel: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      getVoices: jest.fn(() => [
        { lang: "th-TH", name: "Thai Female" },
        { lang: "en-US", name: "English Female" },
      ]),
    };

    global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => {
      mockUtteranceInstance = { text, rate: 1, volume: 1, lang: "", pitch: 1 };
      return mockUtteranceInstance;
    });
  });

  afterEach(() => {
    window.AudioContext = originalAudioContext;
    window.Audio = originalAudio;
    window.speechSynthesis = originalSpeechSynthesis;
    if (window.HTMLMediaElement && originalPlay) {
      window.HTMLMediaElement.prototype.play = originalPlay;
    }
    jest.clearAllMocks();
  });

  describe("playAlertSound", () => {
    test("does not play when preset is 'none'", () => {
      playAlertSound({ preset: "none" });
      expect(window.AudioContext).not.toHaveBeenCalled();
      expect(window.Audio).not.toHaveBeenCalled();
    });

    test("plays mythic-horn preset with Web Audio API", () => {
      playAlertSound({ preset: "mythic-horn", volume: 90 });
      expect(window.AudioContext).toHaveBeenCalled();
      expect(mockOscillator.type).toBe("triangle");
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    test("plays dragon-roar preset with sawtooth oscillator", () => {
      playAlertSound({ preset: "dragon-roar", volume: 80 });
      expect(mockOscillator.type).toBe("sawtooth");
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    test("plays ancient-bell preset with sine oscillator", () => {
      playAlertSound({ preset: "ancient-bell", volume: 75 });
      expect(mockOscillator.type).toBe("sine");
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    test("plays custom sound audio file when preset is 'custom' and file is provided", () => {
      playAlertSound({
        preset: "custom",
        volume: 60,
        customSoundFile: "data:audio/mp3;base64,mockSound",
      });
      expect(window.Audio).toHaveBeenCalledWith("data:audio/mp3;base64,mockSound");
      expect(mockAudioInstance.volume).toBe(0.6);
      expect(mockAudioInstance.play).toHaveBeenCalled();
    });

    test("handles AudioContext failure or missing API gracefully", () => {
      window.AudioContext = null;
      window.webkitAudioContext = null;
      expect(() => {
        playAlertSound({ preset: "mythic-horn" });
      }).not.toThrow();
    });
  });

  describe("speakAlertText & getAvailableVoices", () => {
    test("fetches available voices properly", async () => {
      const voices = await getAvailableVoices();
      expect(voices).toHaveLength(2);
    });

    test("speaks text with thai voice preset when available", async () => {
      await speakAlertText({
        text: "ผู้สนับสนุน โดเนท 50 บาท",
        voice: "th-female",
        volume: 80,
        speed: "1.25x",
      });

      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
      expect(mockUtteranceInstance.rate).toBe(1.25);
      expect(mockUtteranceInstance.volume).toBe(0.8);
      expect(mockUtteranceInstance.lang).toBe("th-TH");
      expect(mockUtteranceInstance.pitch).toBe(1.15);
    });

    test("speaks text with english male voice preset", async () => {
      await speakAlertText({
        text: "User donated $50",
        voice: "en-male",
        volume: 100,
        speed: "1.0x",
      });

      expect(mockUtteranceInstance.lang).toBe("en-US");
      expect(mockUtteranceInstance.pitch).toBe(0.85);
    });

    test("falls back to Google TTS audio element when no Thai voice exists in browser", async () => {
      window.speechSynthesis.getVoices = jest.fn(() => [
        { lang: "en-US", name: "English Only" },
      ]);

      const playSpy = jest.spyOn(window.HTMLMediaElement.prototype, "play");

      await speakAlertText({
        text: "แฟนคลับเบอร์หนึ่ง โดเนท 500 บาท",
        voice: "th-female",
        volume: 85,
        speed: "1.0x",
      });

      expect(playSpy).toHaveBeenCalled();
    });

    test("handles missing text or missing speechSynthesis gracefully", async () => {
      await speakAlertText({ text: "" });
      expect(window.speechSynthesis.speak).not.toHaveBeenCalled();

      delete window.speechSynthesis;
      await expect(speakAlertText({ text: "Hello" })).resolves.not.toThrow();
    });
  });

  describe("stopAllAlertAudio", () => {
    test("cancels active speech synthesis", () => {
      stopAllAlertAudio();
      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    });
  });
});
