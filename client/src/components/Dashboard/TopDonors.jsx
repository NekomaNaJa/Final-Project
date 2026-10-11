import React from "react";
import { Trophy, Crown } from "lucide-react";
import { Card, CardHeader } from "./CardWrapper";

const TopDonors = ({ donors }) => {
  const hasDonors = Array.isArray(donors) && donors.length > 0;

  return (
    <Card>
      <CardHeader
        icon={Trophy}
        title="อันดับผู้โดเนท"
        subtitle="Top supporters"
        subtitleClass="font-sans"
      />
      <ul className="divide-y divide-white/5">
        {hasDonors ? (
          donors.map((u, idx) => {
            const rank = u.rank || idx + 1;
            const amount = u.totalAmount !== undefined ? u.totalAmount : u.amount || 0;
            return (
              <li key={u._id || u.name || rank} className="flex items-center gap-3 px-5 py-3.5">
                <div
                  className={`w-8 h-8 grid place-items-center rounded-full text-xs font-bold ${
                    rank === 1
                      ? "bg-linear-to-br from-yellow-400 to-orange-500 text-white"
                      : "bg-white/5 text-gray-500"
                  }`}
                >
                  {rank === 1 ? <Crown size={14} /> : rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-300 truncate">
                    {u.name || "ผู้ไม่ประสงค์ออกนาม"}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
                    {u.badge || "SUPPORTER"}
                  </p>
                </div>
                <p className="text-sm font-bold text-purple-400">
                  ฿{Number(amount).toLocaleString()}
                </p>
              </li>
            );
          })
        ) : (
          <li className="px-5 py-8 text-center text-sm text-gray-500">
            ยังไม่มีข้อมูลผู้สนับสนุน
          </li>
        )}
      </ul>
    </Card>
  );
};

export default TopDonors;