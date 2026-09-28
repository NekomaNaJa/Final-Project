import { Scroll } from "lucide-react";
import { Card, CardHeader } from "./CardWrapper";

const placeholders = [
  { initial: "S" },
  { initial: "A" },
  { initial: "N" },
  { initial: "V" },
];

const RealtimeFeed = () => (
  <Card>
    <CardHeader
      icon={Scroll}
      title="โดเนทล่าสุด"
      subtitle="Realtime feed"
      subtitleClass="font-sans"
    />
    <ul className="divide-y divide-white/5">
      {placeholders.map((p, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="w-10 h-10 grid place-items-center rounded-full bg-linear-to-br from-purple-600/30 to-red-600/20 text-sm font-bold text-gray-300">
            {p.initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-500">
              ยังไม่มีข้อมูล
            </p>
            <p className="text-xs text-gray-700 truncate">—</p>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-purple-400">+฿0</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
              —
            </p>
          </div>
        </li>
      ))}
    </ul>
  </Card>
);

export default RealtimeFeed;