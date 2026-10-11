import React from "react";
import { Scroll, Clock } from "lucide-react";
import { Card, CardHeader } from "./CardWrapper";

const RealtimeFeed = ({ feed }) => {
  const approvedFeed = (feed || []).filter(
    (item) => !item.status || item.status === "approved"
  );
  const hasRealData = approvedFeed.length > 0;

  return (
    <Card>
      <CardHeader
        icon={Scroll}
        title="โดเนทล่าสุด"
        subtitle="Realtime feed"
        subtitleClass="font-sans"
        right={
          hasRealData ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                อนุมัติแล้ว
              </span>
            </div>
          ) : null
        }
      />
      <ul className="divide-y divide-white/5">
        {hasRealData ? (
          approvedFeed.map((item, i) => {
            const name = item.donorName || "ผู้ไม่ประสงค์ออกนาม";
            const initial = name.charAt(0).toUpperCase() || "D";
            const time = item.createdAt
              ? new Date(item.createdAt).toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—";

            return (
              <li
                key={item._id || i}
                className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-11 h-11 shrink-0 grid place-items-center rounded-xl bg-purple-600/15 border border-purple-500/25 text-base font-bold text-purple-300">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-sm font-semibold text-white truncate">
                      {name}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {item.message || "—"}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base md:text-lg font-bold text-purple-400">
                    +฿{Number(item.amount).toLocaleString()}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 flex items-center justify-end gap-1 mt-0.5">
                    <Clock size={11} className="text-gray-500" />
                    <span>{time}</span>
                  </p>
                </div>
              </li>
            );
          })
        ) : (
          <li className="px-5 py-8 text-center text-sm text-gray-500">
            ยังไม่มีข้อมูล
          </li>
        )}
      </ul>
    </Card>
  );
};

export default RealtimeFeed;