import React from "react";
import { Trophy, Crown } from "lucide-react";
import { Card, CardHeader } from "./CardWrapper";

const defaultDonors = [
  { rank: 1, name: "—", badge: "MYTHIC", amount: 0 },
  { rank: 2, name: "—", badge: "ARCANE", amount: 0 },
  { rank: 3, name: "—", badge: "RUNE", amount: 0 },
  { rank: 4, name: "—", badge: "MANA", amount: 0 },
];

const TopDonors = ({ donors }) => {
  const displayDonors =
    donors && donors.length > 0
      ? defaultDonors.map((def, idx) => {
          if (donors[idx]) {
            return {
              rank: donors[idx].rank || idx + 1,
              name: donors[idx].name || "ผู้ไม่ประสงค์ออกนาม",
              badge: donors[idx].badge || def.badge,
              amount: donors[idx].totalAmount || 0,
            };
          }
          return def;
        })
      : defaultDonors;

  return (
    <Card>
      <CardHeader
        icon={Trophy}
        title="อันดับผู้โดเนท"
        subtitle="Top supporters"
        subtitleClass="font-sans"
      />
      <ul className="divide-y divide-white/5">
        {displayDonors.map((u) => (
          <li key={u.rank} className="flex items-center gap-3 px-5 py-3.5">
            <div
              className={`w-8 h-8 grid place-items-center rounded-full text-xs font-bold ${
                u.rank === 1
                  ? "bg-linear-to-br from-yellow-400 to-orange-500 text-white"
                  : "bg-white/5 text-gray-500"
              }`}
            >
              {u.rank === 1 ? <Crown size={14} /> : u.rank}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-300 truncate">
                {u.name}
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
                {u.badge}
              </p>
            </div>
            <p className="text-sm font-bold text-purple-400">
              ฿{Number(u.amount).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default TopDonors;