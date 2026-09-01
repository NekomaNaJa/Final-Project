import React, { useState } from "react";

const DonorTrueMoneyForm = ({ onSubmit, isSubmitting = false }) => {
  const [giftLink, setGiftLink] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = giftLink.trim();
    if (!trimmed) {
      alert("กรุณากรอกลิงก์ซองของขวัญทรูมันนี่ อั่งเปา");
      return;
    }
    if (!trimmed.includes("truemoney.com")) {
      alert("กรุณากรอกลิงก์ซองของขวัญทรูมันนี่ที่ถูกต้อง");
      return;
    }
    if (onSubmit) {
      onSubmit({ giftLink: trimmed, method: "truemoney" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      {/* TrueMoney Gift Link Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-[#d4cfdf]">
            ลิงก์ทรูมันนี่ อั่งเปา
          </label>
          <span className="text-xs text-gray-500">
            {giftLink.length}/100
          </span>
        </div>
        <input
          type="url"
          maxLength={100}
          value={giftLink}
          onChange={(e) => setGiftLink(e.target.value)}
          placeholder="https://gift.truemoney.com/campaign/?v=xxxx"
          required
          className="w-full rounded-2xl border border-[#2e2648] bg-[#110d22] px-6 py-4 text-sm sm:text-base font-medium text-white placeholder-[#6e6682] focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all shadow-inner"
        />
      </div>

      {/* Confirm Payment Button */}
      <div className="pt-2">
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

export default DonorTrueMoneyForm;
