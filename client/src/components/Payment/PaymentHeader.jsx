import React from "react";

const PaymentHeader = () => {
  return (
    <div className="flex flex-col items-center text-center space-y-2 pt-2 pb-4">
      <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.22em] text-[#aa8df1]">
        PAYMENT CHANNELS
      </p>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide">
        ช่องทาง <span className="text-[#a855f7]">การรับเงิน</span>
      </h1>
      <p className="text-sm text-[#8c859c] max-w-lg">
        เชื่อมต่อบัญชีของคุณเพื่อรับเงินโอนตรงจากผู้สนับสนุน
      </p>
    </div>
  );
};

export default PaymentHeader;
