import React, { useState, useEffect, useRef } from "react";
import { QrCode, Lock } from "lucide-react";
import DonorSlipUpload from "./DonorSlipUpload";

const DonorPromptPayForm = ({
  minAmount = 1,
  promptpayNumber = "",
  presetAmount = null,
  selectedMission = null,
  onSubmit,
  isSubmitting = false,
}) => {
  const [amount, setAmount] = useState(() => {
    if (selectedMission?.price !== undefined && selectedMission?.price !== null) {
      return selectedMission.price;
    }
    if (presetAmount !== null && presetAmount !== undefined) {
      return presetAmount;
    }
    return minAmount > 0 ? minAmount : 10;
  });
  const [slipFile, setSlipFile] = useState(null);
  const [qrUrl, setQrUrl] = useState("");

  // Sync amount when selectedMission or presetAmount changes
  useEffect(() => {
    if (selectedMission?.price !== undefined && selectedMission?.price !== null) {
      setAmount(selectedMission.price);
    } else if (presetAmount !== null && presetAmount !== undefined) {
      setAmount(presetAmount);
    }
  }, [selectedMission, presetAmount]);

  // Sync amount with minAmount whenever minAmount changes
  useEffect(() => {
    setAmount((prev) => {
      if (selectedMission?.price !== undefined && selectedMission?.price !== null) {
        return selectedMission.price;
      }
      if (minAmount > 0 && (Number(prev) < minAmount || !prev)) {
        return minAmount;
      }
      return prev;
    });
  }, [minAmount, selectedMission]);

  // Update PromptPay QR code whenever amount or promptpayNumber changes
  useEffect(() => {
    let currentAmt = Number(amount);
    if (selectedMission?.price !== undefined && selectedMission?.price !== null) {
      currentAmt = Number(selectedMission.price);
    }
    const validAmount = currentAmt >= minAmount ? currentAmt : minAmount || 1;
    const cleanNumber = promptpayNumber ? promptpayNumber.replace(/[^0-9]/g, "") : "";
    if (cleanNumber) {
      setQrUrl(`https://promptpay.io/${cleanNumber}/${validAmount}.png`);
    } else {
      setQrUrl("");
    }
  }, [amount, promptpayNumber, minAmount, selectedMission]);

  const isSubmittingRef = useRef(false);
  const qrImgRef = useRef(null);

  // ตรวจจับและกู้คืนค่า src หากผู้ใช้เปิด DevTools เพื่อพยายามแก้ไข QR Code (Anti-tampering)
  useEffect(() => {
    const imgEl = qrImgRef.current;
    if (!imgEl || !qrUrl || typeof MutationObserver === "undefined") return;

    const observer = new MutationObserver(() => {
      const currentSrc = imgEl.getAttribute("src");
      if (currentSrc && currentSrc !== qrUrl) {
        imgEl.setAttribute("src", qrUrl);
      }
    });

    try {
      observer.observe(imgEl, { attributes: true, attributeFilter: ["src"] });
    } catch {
      // Ignored for testing environments without full DOM observer support
    }

    return () => observer.disconnect();
  }, [qrUrl]);

  useEffect(() => {
    if (!isSubmitting) {
      isSubmittingRef.current = false;
    }
  }, [isSubmitting]);

  const handleBlur = () => {
    if (selectedMission?.price !== undefined && selectedMission?.price !== null) {
      setAmount(selectedMission.price);
      return;
    }
    const num = Number(amount);
    if (Number.isNaN(num) || num < minAmount) {
      setAmount(minAmount);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting || isSubmittingRef.current) {
      return;
    }
    const finalAmount =
      selectedMission?.price !== undefined && selectedMission?.price !== null
        ? Number(selectedMission.price)
        : Number(amount);

    if (finalAmount < minAmount) {
      alert(`จำนวนเงินขั้นต่ำคือ ${minAmount} บาท`);
      setAmount(minAmount);
      return;
    }

    // ตรวจสอบความถูกต้องของรูปภาพ QR Code ป้องกันการแอบแก้ไข src ผ่าน DevTools
    if (qrImgRef.current && qrUrl) {
      const currentSrc = qrImgRef.current.getAttribute("src") || qrImgRef.current.src || "";
      if (currentSrc && currentSrc !== qrUrl) {
        alert("ตรวจพบการดัดแปลงข้อมูล QR Code กรุณารีเฟรชหน้าเว็บและทำรายการใหม่อีกครั้ง");
        qrImgRef.current.setAttribute("src", qrUrl);
        return;
      }
    }

    if (!slipFile) {
      alert("กรุณาแนบรูปภาพสลิปการโอนเงินเพื่อยืนยัน");
      return;
    }
    isSubmittingRef.current = true;
    if (onSubmit) {
      onSubmit({ amount: finalAmount, slipFile, method: "promptpay" });
    }
  };

  const isLocked = Boolean(selectedMission);

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      {/* Amount Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="donor-promptpay-amount" className="text-sm font-semibold text-[#d4cfdf] flex items-center gap-2">
            <span>จำนวนเงิน (บาท)</span>
            {isLocked && (
              <span
                data-testid="amount-locked-badge"
                className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-bold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg select-none"
              >
                <Lock size={11} className="text-amber-400" />
                <span>ล็อคตามภารกิจ</span>
              </span>
            )}
          </label>
          {minAmount > 0 && !isLocked && (
            <span className="text-xs text-purple-300 font-medium">
              ขั้นต่ำ {minAmount} บาท
            </span>
          )}
        </div>
        <div className="relative">
          <input
            id="donor-promptpay-amount"
            type="number"
            min={minAmount || 1}
            step="1"
            value={amount}
            readOnly={isLocked}
            onChange={(e) => {
              if (!isLocked) {
                setAmount(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              if (isLocked && e.key !== "Tab") {
                e.preventDefault();
              }
            }}
            onBlur={handleBlur}
            placeholder={`ขั้นต่ำ ${minAmount} บาท`}
            required
            className={`w-full rounded-2xl border px-6 py-4 text-base sm:text-lg font-extrabold transition-all shadow-inner ${
              isLocked
                ? "border-purple-500/50 bg-[#16102d] text-amber-300 cursor-not-allowed select-none pr-12 focus:outline-none"
                : "border-[#2e2648] bg-[#110d22] text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            }`}
          />
          {isLocked && (
            <div
              data-testid="amount-locked-icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-amber-400 pointer-events-none select-none"
              title="ล็อคจำนวนเงินตามภารกิจที่เลือก"
            >
              <Lock size={18} />
            </div>
          )}
        </div>
        {Number(amount) < minAmount && amount !== "" && !isLocked && (
          <p className="text-xs font-semibold text-amber-400">
            ⚠️ ยอดเงินต้องไม่ต่ำกว่า {minAmount} บาท
          </p>
        )}
        {selectedMission && (
          <div
            data-testid="promptpay-mission-badge"
            className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200"
          >
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-purple-400">🎯 ยอดตามภารกิจ:</span>
              <span className="font-semibold truncate">{selectedMission.name}</span>
            </div>
            <span className="shrink-0 font-mono font-bold text-amber-300">
              {Number(selectedMission.price).toLocaleString()} บาท
            </span>
          </div>
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
                ref={qrImgRef}
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

export default DonorPromptPayForm;
