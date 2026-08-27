import { BarChart3 } from "lucide-react";

const DonationChart = () => (
  <section className="rounded-2xl border border-[#302a49] bg-[#1d1930] p-4 min-h-[220px]">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-[#9b78ff]" />
        <div>
          <p className="text-xs font-bold text-[#d9d5e1]">ภาพรวมรายได้ของคุณ</p>
          <p className="text-[8px] uppercase tracking-wide text-[#766f83]">Revenue overview</p>
        </div>
      </div>
      <div className="flex overflow-hidden rounded-md border border-[#40385d] text-[9px]">
        <button className="bg-[#7656dc] px-2 py-1 text-white">7D</button>
        <button className="border-l border-[#40385d] px-2 py-1 text-[#aaa4b5]">1M</button>
        <button className="border-l border-[#40385d] px-2 py-1 text-[#aaa4b5]">ALL</button>
      </div>
    </div>

    <div className="relative mt-3 h-36 overflow-hidden rounded-xl border border-[#2d2841] bg-[#1b172c] px-5 pb-5 pt-3">
      <div className="absolute inset-x-5 top-3 bottom-5 grid grid-rows-5">
        {[0, 1, 2, 3, 4].map((line) => <div key={line} className="border-t border-[#342e49]" />)}
      </div>
      <div className="absolute inset-y-3 left-5 right-5 grid grid-cols-7">
        {[0, 1, 2, 3, 4, 5, 6].map((line) => <div key={line} className="border-l border-[#2b2640]" />)}
      </div>
      <div className="absolute inset-x-5 bottom-1 flex justify-between text-[7px] text-[#766f83]">
        <span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span><span>อา</span>
      </div>
    </div>
  </section>
);

export default DonationChart;
