import React, { useRef } from "react";
import { Music, X } from "lucide-react";

const AudioUploadField = ({ fileName, onFileSelect }) => {
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.match("audio/mpeg") && !file.name.toLowerCase().endsWith(".mp3")) {
      alert("รองรับเฉพาะไฟล์เสียงประเภท MP3 เท่านั้น");
      return;
    }

    try {
      if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
        window._donixCustomAudioMap = window._donixCustomAudioMap || {};
        window._donixCustomAudioMap[file.name] = URL.createObjectURL(file);
      }
    } catch {
      // ignore
    }

    if (typeof FileReader !== "undefined") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (e.target?.result) {
            localStorage.setItem("donix_audio_" + file.name, e.target.result);
          }
        } catch {
          // ignore quota error
        }
      };
      try {
        reader.readAsDataURL(file);
      } catch {
        // ignore
      }
    }

    onFileSelect?.(file.name);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,.mp3"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex flex-1 items-center gap-2 rounded-xl border border-[#2e2648] bg-[#110d22] px-3 py-2 text-xs text-gray-300 hover:border-purple-500/50 transition-all"
      >
        <Music size={14} className="text-purple-400" />
        <span className="truncate">{fileName || "เลือกไฟล์ MP3"}</span>
      </button>
      {fileName && (
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window._donixCustomAudioMap) {
              delete window._donixCustomAudioMap[fileName];
            }
            try {
              localStorage.removeItem("donix_audio_" + fileName);
            } catch {
              // ignore
            }
            onFileSelect?.("");
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2e2648] text-gray-400 hover:border-red-500/40 hover:text-red-400"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default AudioUploadField;
