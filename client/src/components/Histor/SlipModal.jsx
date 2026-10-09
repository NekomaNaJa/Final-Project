import React, { useState, useEffect } from "react";
import { X, Check, AlertCircle, FileText, ZoomIn, Maximize2, ExternalLink } from "lucide-react";

const channelNames = {
  promptpay: "PromptPay (พร้อมเพย์)",
  bank: "โอนผ่านธนาคาร",
  truemoney: "TrueMoney Wallet",
};

const SlipModal = ({
  donation,
  isOpen,
  onClose,
  onApprove,
  onReject,
  actionLoading = false,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setIsZoomed(false);
  }, [donation, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isZoomed) {
          setIsZoomed(false);
        } else if (onClose) {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isZoomed, onClose]);

  if (!isOpen || !donation) return null;

  const raw = donation.raw || donation;
  const id = raw._id || raw.id;
  const donorName = raw.donorName || raw.name || "ผู้ไม่ประสงค์ออกนาม";
  const amount =
    typeof raw.amount === "number"
      ? `฿${raw.amount.toLocaleString()}`
      : raw.amount || "฿0";
  const message = raw.message || "—";
  const channel =
    channelNames[raw.paymentMethod] || raw.paymentMethod || raw.channel || "PromptPay";
  const status = raw.status;
  const isPending = status === "pending" || status === "รอดำเนินการ";

  const dateStr = raw.createdAt
    ? new Date(raw.createdAt).toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : raw.time || "—";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#120f22] p-6 shadow-2xl text-white">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  หลักฐานและรายละเอียดการบริจาค
                </h3>
                <p className="text-xs text-gray-400">รหัสรายการ: {id}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Slip Image / Content */}
          <div className="my-5 flex flex-col items-center">
            {raw.slipImage ? (
              <div className="relative group max-h-72 w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setIsZoomed(true)}
                  className="relative flex items-center justify-center w-full h-full max-h-72 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-xl"
                  title="คลิกเพื่อขยายดูรูปสลิปขนาดใหญ่"
                  aria-label="คลิกเพื่อขยายดูรูปสลิปขนาดใหญ่"
                >
                  <img
                    src={raw.slipImage}
                    alt="สลิปหลักฐานการโอน"
                    className="max-h-72 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                  />

                  {/* Badge top-right */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-[11px] text-gray-200 shadow-md group-hover:bg-purple-600/90 group-hover:text-white group-hover:border-purple-400/30 transition-all pointer-events-none">
                    <ZoomIn size={13} className="shrink-0" />
                    <span>คลิกเพื่อขยาย</span>
                  </div>

                  {/* Hover overlay hint */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-xs font-medium text-white shadow-xl">
                      <Maximize2 size={14} className="text-purple-400" />
                      ขยายรูปสลิป
                    </span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full py-8 rounded-xl border border-dashed border-white/15 bg-white/5 text-gray-400">
                <AlertCircle size={28} className="mb-2 text-gray-500" />
                <p className="text-xs">ไม่มีรูปสลิปแนบมากับรายการนี้</p>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="space-y-2.5 rounded-xl bg-white/5 p-4 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">ผู้สนับสนุน:</span>
              <span className="font-semibold text-white">{donorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">จำนวนเงิน:</span>
              <span className="font-bold text-purple-400 text-sm">{amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">ช่องทางการชำระ:</span>
              <span className="text-gray-300">{channel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">วันและเวลา:</span>
              <span className="text-gray-300">{dateStr}</span>
            </div>
            <div className="flex flex-col gap-1 pt-1 border-t border-white/5">
              <span className="text-gray-400">ข้อความโดเนท:</span>
              <p className="text-gray-200 italic bg-black/30 p-2.5 rounded-lg">
                "{message}"
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3">
            {isPending ? (
              <>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => onReject(id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                >
                  <X size={14} />
                  ปฏิเสธรายการ
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => onApprove(id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)] disabled:opacity-50 transition-colors"
                >
                  <Check size={14} />
                  อนุมัติรายการ
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 bg-white/10 hover:bg-white/15 transition-colors"
              >
                ปิด
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox / Enlarged Slip Modal */}
      {isZoomed && raw.slipImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          {/* Backdrop button for closing on click */}
          <button
            type="button"
            aria-label="ปิดรูปขนาดใหญ่"
            onClick={() => setIsZoomed(false)}
            className="absolute inset-0 h-full w-full bg-transparent cursor-default border-0"
          />

          <div className="relative z-10 flex flex-col items-center max-w-[95vw] max-h-[95vh]">
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <FileText size={16} className="text-purple-400" />
                <span className="font-semibold text-white">สลิปโอนเงิน (ขนาดเต็ม)</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400">{donorName}</span>
                <span className="text-purple-400 font-bold">{amount}</span>
              </div>
              <div className="flex items-center gap-2">
                {(raw.slipImage.startsWith("data:") || raw.slipImage.startsWith("http")) && (
                  <a
                    href={raw.slipImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 bg-white/10 hover:bg-white/20 hover:text-white transition-colors"
                    title="เปิดรูปในแท็บใหม่"
                  >
                    <ExternalLink size={13} />
                    <span>เปิดแท็บใหม่</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setIsZoomed(false)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
                  title="ปิดรูปภาพ (Esc)"
                  aria-label="ปิดรูปภาพ"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Enlarged Image Container */}
            <div className="relative max-h-[82vh] max-w-[90vw] overflow-auto rounded-2xl border border-white/15 bg-black/60 shadow-2xl p-1 flex items-center justify-center">
              <img
                src={raw.slipImage}
                alt="สลิปหลักฐานการโอนขนาดเต็ม"
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-xl select-none"
              />
            </div>

            <p className="mt-2.5 text-[11px] text-gray-400">
              กด Esc หรือคลิกพื้นที่ว่างรอบรูปเพื่อปิด
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default SlipModal;
