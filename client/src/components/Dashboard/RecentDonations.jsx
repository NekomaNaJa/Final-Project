import { Radio } from "lucide-react";

const RecentDonations = () => (
  <section className="rounded-2xl border border-[#302a49] bg-[#1d1930] p-4 min-h-[170px]">
    <div className="flex items-center gap-2">
      <Radio className="h-4 w-4 text-[#a979ff]" />
      <div>
        <p className="text-xs font-bold text-[#d9d5e1]">โดเนทล่าสุด</p>
        <p className="text-[8px] uppercase tracking-wide text-[#766f83]">Realtime feed</p>
      </div>
    </div>
    <div className="grid h-24 place-items-center text-[9px] text-[#766f83]">ยังไม่มีข้อมูล</div>
  </section>
);

export default RecentDonations;
