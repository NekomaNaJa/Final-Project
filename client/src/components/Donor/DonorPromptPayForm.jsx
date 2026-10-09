import React, { useState, useEffect } from "react";
import { QrCode } from "lucide-react";
import DonorSlipUpload from "./DonorSlipUpload";

const DonorPromptPayForm = ({
  minAmount = 1,
  promptpayNumber = "0812345678",
  onSubmit,
  isSubmitting = false,
}) => {
  const [amount, setAmount] = useState(minAmount > 0 ? minAmount : 10);
  const [slipFile, setSlipFile] = useState(null);
  const [qrUrl, setQrUrl] = useState("");

  // Sync amount with minAmount whenever minAmount changes
  useEffect(() => {
    setAmount((prev) => {
      if (minAmount > 0 && (Number(prev) < minAmount || !prev)) {
        return minAmount;
      }
      return prev;
    });
  }, [minAmount]);

  // Update PromptPay QR code whenever amount or promptpayNumber changes
  useEffect(() => {
    const validAmount = Number(amount) >= minAmount ? Number(amount) : minAmount || 1;
    const cleanNumber = promptpayNumber.replace(/[^0-9]/g, "") || "0812345678";
    setQrUrl(`https://promptpay.io/${cleanNumber}/${validAmount}.png`);
  }, [amount, promptpayNumber, minAmount]);

  const handleBlur = () => {
    const num = Number(amount);
    if (isNaN(num) || num < minAmount) {
      setAmount(minAmount);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Number(amount) < minAmount) {
      alert(`จำนวนเงินขั้นต่ำคือ ${minAmount} บาท`);
      setAmount(minAmount);
      return;
    }
    if (!slipFile) {
      alert("กรุณาแนบรูปภาพสลิปการโอนเงินเพื่อยืนยัน");
      return;
    }
    if (onSubmit) {
      onSubmit({ amount: Number(amount), slipFile, method: "promptpay" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      {/* Amount Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="donor-promptpay-amount" className="text-sm font-semibold text-[#d4cfdf]">
            จำนวนเงิน (บาท)
          </label>
          {minAmount > 0 && (
            <span className="text-xs text-purple-300 font-medium">
              ขั้นต่ำ {minAmount} บาท
            </span>
          )}
        </div>
        <input
          id="donor-promptpay-amount"
          type="number"
          min={minAmount || 1}
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={handleBlur}
          placeholder={`ขั้นต่ำ ${minAmount} บาท`}
          required
          className="w-full rounded-2xl border border-[#2e2648] bg-[#110d22] px-6 py-4 text-base sm:text-lg font-extrabold text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all shadow-inner"
        />
        {Number(amount) < minAmount && amount !== "" && (
          <p className="text-xs font-semibold text-amber-400">
            ⚠️ ยอดเงินต้องไม่ต่ำกว่า {minAmount} บาท
          </p>
        )}
      </div>

      {/* QR Code & Slip Upload Grid */}
      <div className="grid sm:grid-cols-[190px_minmax(0,1fr)] gap-4 sm:gap-5 items-stretch">
        {/* Dynamic PromptPay QR Code Container */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#2b2542] bg-[#110d22] p-4 shadow-inner">
          <div className="w-full flex items-center justify-center gap-1.5 pb-2.5 border-b border-[#241c3a] text-[#00B4D8] font-bold text-xs">
            <QrCode size={15} />
            <span>PromptPay QR</span>
          </div>

          <div className="relative w-36 h-36 mt-3 bg-white rounded-2xl p-1.5 flex items-center justify-center overflow-hidden shadow-lg">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt={`PromptPay QR ${amount} THB`}
                key={qrUrl}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PromptPay:${promptpayNumber}:Amount:${amount}`;
                }}
              />
            ) : (
              <div className="text-gray-400 text-xs">กำลังสร้าง QR...</div>
            )}
          </div>

          <p className="mt-2.5 text-xs sm:text-sm font-bold text-purple-300">
            {Number(amount) || 0} บาท
          </p>
        </div>

        {/* Slip Upload Box */}
        <DonorSlipUpload onSlipSelected={(file) => setSlipFile(file)} />
      </div>

      {/* Action Buttons */}
      <div className="pt-2">
        {/* Confirm Payment Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-bold text-white bg-linear-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] shadow-[0_0_24px_rgba(139,92,246,0.45)] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? "กำลังดำเนินการ..." : "ยืนยันการชำระเงิน"}
        </button>
      </div>
    </form>
  );
};

export default DonorPromptPayForm;
