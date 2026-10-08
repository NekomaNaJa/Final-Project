import React from "react";
import { X, Check, AlertCircle, FileText } from "lucide-react";

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
            <div className="max-h-72 w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 flex items-center justify-center">
              <img
                src={raw.slipImage}
                alt="สลิปหลักฐานการโอน"
                className="max-h-72 w-auto object-contain"
              />
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
  );
};

export default SlipModal;
