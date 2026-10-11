import React, { useState, useEffect, useRef } from "react";

const DonorTrueMoneyForm = ({ onSubmit, isSubmitting = false, selectedMission = null }) => {
  const [giftLink, setGiftLink] = useState("");
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (!isSubmitting) {
      isSubmittingRef.current = false;
    }
  }, [isSubmitting]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting || isSubmittingRef.current) {
      return;
    }
    const trimmed = giftLink.trim();
    if (!trimmed) {
      alert("กรุณากรอกลิงก์ซองของขวัญทรูมันนี่ อั่งเปา");
      return;
    }
    if (!trimmed.includes("truemoney.com")) {
      alert("กรุณากรอกลิงก์ซองของขวัญทรูมันนี่ที่ถูกต้อง");
      return;
    }
    isSubmittingRef.current = true;
    if (onSubmit) {
      onSubmit({ giftLink: trimmed, method: "truemoney" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      {/* TrueMoney Gift Link Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="donor-truemoney-link" className="text-sm font-semibold text-[#d4cfdf]">
            ลิงก์ทรูมันนี่ อั่งเปา
          </label>
          <span className="text-xs text-gray-500">
            {giftLink.length}/100
          </span>
        </div>
        <input
          id="donor-truemoney-link"
          type="url"
          maxLength={100}
          value={giftLink}
          onChange={(e) => setGiftLink(e.target.value)}
          placeholder="https://gift.truemoney.com/campaign/?v=xxxx"
          required
          className="w-full rounded-2xl border border-[#2e2648] bg-[#110d22] px-6 py-4 text-sm sm:text-base font-medium text-white placeholder-[#6e6682] focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all shadow-inner"
        />
      </div>

      {/* Selected Mission Badge */}
      {selectedMission && (
        <div
          data-testid="truemoney-mission-badge"
          className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200"
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-purple-400">🎯 ยอดซองตามภารกิจ:</span>
            <span className="font-semibold truncate">{selectedMission.name}</span>
          </div>
          <span className="shrink-0 font-mono font-bold text-amber-300">
            {Number(selectedMission.price).toLocaleString()} บาท
          </span>
        </div>
      )}

      {/* Confirm Payment Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-bold text-white bg-linear-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] shadow-[0_0_24px_rgba(139,92,246,0.45)] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer ${
            isSubmitting ? "pointer-events-none opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? "กำลังดำเนินการ..." : "ยืนยันการชำระเงิน"}
        </button>
      </div>
    </form>
  );
};

export default DonorTrueMoneyForm;
