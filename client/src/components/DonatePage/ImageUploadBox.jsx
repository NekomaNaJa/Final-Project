import React, { useRef, useState } from "react";
import { Image as ImageIcon, X } from "lucide-react";

const ImageUploadBox = ({ label, onImageSelect, previewUrl: initialPreview = null }) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(initialPreview);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.match("image/(jpeg|png|gif)")) {
      alert("รองรับเฉพาะไฟล์รูปภาพประเภท jpg, png, gif เท่านั้น");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    if (onImageSelect) {
      onImageSelect(file, url);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onImageSelect) {
      onImageSelect(null, null);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-[#d4cfdf]">{label}</label>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFile(e.target.files[0])}
        accept="image/jpeg,image/png,image/gif"
        className="hidden"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`group relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-all ${
          isDragging
            ? "border-purple-400 bg-purple-950/40 shadow-[0_0_20px_rgba(168,85,247,0.25)]"
            : "border-[#372f52] bg-[#120e24]/70 hover:border-purple-500/60 hover:bg-[#18132f]/80"
        }`}
      >
        {preview ? (
          <div className="relative w-full h-28 overflow-hidden rounded-lg">
            <img
              src={preview}
              alt={label}
              className="h-full w-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white">
              คลิกเพื่อเปลี่ยนรูปภาพ
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/70 text-white hover:bg-red-600 flex items-center justify-center transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <>
            {/* Center Purple Icon */}
            <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-[#9333ea] to-[#7c3aed] text-white shadow-[0_0_16px_rgba(147,51,234,0.45)] group-hover:scale-105 transition-transform">
              <ImageIcon size={20} />
            </div>

            {/* Text */}
            <p className="text-xs font-medium text-[#d9d5e3]">
              คลิก/ลากวาง เพื่ออัปโหลด{label}
            </p>
            <p className="mt-1 text-[10px] text-[#78718a]">
              รองรับรูปภาพประเภท jpg, png, gif
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageUploadBox;
