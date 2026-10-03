import React from "react";
import DonorStatusCard from "./DonorStatusCard";

const DonorDisabledCard = () => (
  <DonorStatusCard
    title="ไม่พร้อมให้บริการ"
    description="สตรีมเมอร์ไม่ได้เปิดใช้งานช่องทางการชำระเงินนี้ กรุณาเลือกช่องทางอื่น"
  />
);

export default DonorDisabledCard;
