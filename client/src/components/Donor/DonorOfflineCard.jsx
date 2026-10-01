import React from "react";
import DonorStatusCard from "./DonorStatusCard";

const DonorOfflineCard = () => (
  <DonorStatusCard
    title="ขณะนี้ปิดรับโดเนทชั่วคราว"
    description="สตรีมเมอร์ยังไม่ได้เปิดระบบรับเงินในขณะนี้ กรุณาลองใหม่อีกครั้งภายหลัง"
  />
);

export default DonorOfflineCard;
