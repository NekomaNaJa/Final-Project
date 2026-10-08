import React from "react";
import { Scroll } from "lucide-react";
import { Card, CardHeader } from "./CardWrapper";

const placeholders = [
  { initial: "S" },
  { initial: "A" },
  { initial: "N" },
  { initial: "V" },
];

const RealtimeFeed = ({ feed }) => {
  const hasRealData = feed && feed.length > 0;

  return (
    <Card>
      <CardHeader
        icon={Scroll}
        title="โดเนทล่าสุด"
        subtitle="Realtime feed"
        subtitleClass="font-sans"
      />
      <ul className="divide-y divide-white/5">
        {hasRealData
          ? feed.map((item, i) => {
              const name = item.donorName || "ผู้ไม่ประสงค์ออกนาม";
              const initial = name.charAt(0).toUpperCase() || "D";
              const time = item.createdAt
                ? new Date(item.createdAt).toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—";

              return (
                <li key={item._id || i} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 grid place-items-center rounded-full bg-linear-to-br from-purple-600/30 to-red-600/20 text-sm font-bold text-gray-300">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {item.message || "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-purple-400">
                      +฿{Number(item.amount).toLocaleString()}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">
                      {time}
                    </p>
                  </div>
                </li>
              );
            })
          : placeholders.map((p, i) => (
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
};

export default RealtimeFeed;