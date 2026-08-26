import { Trophy } from "lucide-react";

const SupportPanel = () => (
  <section className="rounded-2xl border border-[#302a49] bg-[#1d1930] p-4 min-h-[220px]">
    <div className="flex items-center gap-2">
      <div className="grid h-8 w-8 place-items-center rounded-md border border-[#605c2e] bg-[#2b2a1c] text-[#c2c35f]">
        <Trophy className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-bold text-[#d9d5e1]">อันดับผู้โดเนท</p>
        <p className="text-[8px] uppercase tracking-wide text-[#766f83]">Top supporters</p>
      </div>
    </div>
    <div className="grid h-32 place-items-center text-center text-[9px] text-[#766f83]">
      ยังไม่มีข้อมูล
    </div>
  </section>
);

export default SupportPanel;
