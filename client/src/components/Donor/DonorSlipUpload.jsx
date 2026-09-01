import React, { useRef, useState } from "react";
import { QrCode, X } from "lucide-react";

const DonorSlipUpload = ({ onSlipSelected }) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.match("image/(jpeg|png|gif|webp)")) {
      alert("รองรับเฉพาะไฟล์รูปภาพประเภท jpg, png, gif, webp เท่านั้น");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    if (onSlipSelected) {
      onSlipSelected(file, url);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onSlipSelected) {
      onSlipSelected(null, null);
    }
  };

  return (
    <div className="w-full h-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFile(e.target.files[0])}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`group relative flex min-h-[170px] sm:min-h-[190px] h-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-5 text-center transition-all ${
          isDragging
            ? "border-purple-400 bg-purple-950/40 shadow-[0_0_20px_rgba(168,85,247,0.25)]"
            : "border-[#372f52] bg-[#110d22]/80 hover:border-purple-500/60 hover:bg-[#18132f]/90"
        }`}
      >
        {preview ? (
          <div className="relative w-full h-36 sm:h-40 overflow-hidden rounded-xl">
            <img
              src={preview}
              alt="Slip Preview"
              className="h-full w-full object-contain rounded-xl bg-black/40"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs sm:text-sm text-white font-medium">
              คลิกเพื่อเปลี่ยนรูปภาพ
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/80 text-white hover:bg-red-600 flex items-center justify-center transition-colors shadow-md"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <>
            {/* Center Icon */}
            <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-300 group-hover:border-purple-500/50 group-hover:text-purple-300 transition-colors">
              <QrCode size={24} />
            </div>

            {/* Text */}
            <p className="text-sm font-semibold text-gray-200">
              คลิก/ลากวาง เพื่ออัปโหลดสลิปการโอน
            </p>
            <p className="mt-1 text-xs text-[#7e778d]">
              ต้องเป็นสลิปที่มี QR Code ในรูปเท่านั้น
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default DonorSlipUpload;
