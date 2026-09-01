import React, { useState } from "react";
import { Landmark, Copy, Check, Smartphone } from "lucide-react";
import DonorSlipUpload from "./DonorSlipUpload";

const DonorBankForm = ({
  bankName = "ธนาคารไทยพาณิชย์ (SCB)",
  accountNumber = "4170606722",
  accountName = "มนต์ธร กอเจริญทรัพย์",
  onSubmit,
  isSubmitting = false,
}) => {
  const [slipFile, setSlipFile] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(accountNumber.replace(/[^0-9]/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!slipFile) {
      alert("กรุณาแนบรูปภาพสลิปการโอนเงินเพื่อยืนยัน");
      return;
    }
    if (onSubmit) {
      onSubmit({ slipFile, method: "bank" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      {/* Bank Info & Slip Upload Grid */}
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        {/* Bank Info Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#2b2542] bg-[#110d22] p-5 shadow-inner">
          <div className="space-y-4">
            {/* Bank Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4e2d84] text-white shadow-md shrink-0">
                <Landmark size={20} />
              </div>
              <p className="text-sm sm:text-base font-bold text-white tracking-wide">
                {bankName}
              </p>
            </div>

            {/* Account Number with Copy Button */}
            <div className="rounded-xl border border-[#2e2648] bg-[#18132f]/90 p-3.5 flex items-center justify-between">
              <span className="font-mono text-base sm:text-lg font-bold text-purple-200 tracking-wider">
                {accountNumber}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                title="คัดลอกเลขที่บัญชี"
                className="flex items-center gap-1.5 rounded-lg bg-purple-600/30 border border-purple-500/40 px-2.5 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-600 hover:text-white transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span>คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>คัดลอก</span>
                  </>
                )}
              </button>
            </div>

            {/* Account Name */}
            <div className="pt-1">
              <p className="text-xs text-[#7e778d]">ชื่อเจ้าของบัญชี</p>
              <p className="text-sm font-bold text-gray-100 mt-1">
                {accountName || "ชื่อเจ้าของบัญชี"}
              </p>
            </div>
          </div>
        </div>

        {/* Slip Upload Box */}
        <DonorSlipUpload onSlipSelected={(file) => setSlipFile(file)} />
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        {/* Upload from Mobile Button */}
        <button
          type="button"
          onClick={() => {
            const input = document.querySelector('input[type="file"]');
            if (input) input.click();
          }}
          className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-2xl border border-[#31284d] bg-[#1a1433]/70 hover:bg-[#231b45] text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-all"
        >
          <Smartphone size={17} />
          <span>อัปโหลดสลิปจากมือถือ</span>
        </button>

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

export default DonorBankForm;
