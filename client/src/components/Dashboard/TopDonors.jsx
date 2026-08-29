import { Trophy, Crown } from "lucide-react";
import { Card, CardHeader } from "./CardWrapper";

const donors = [
  { rank: 1, name: "—", badge: "MYTHIC" },
  { rank: 2, name: "—", badge: "ARCANE" },
  { rank: 3, name: "—", badge: "RUNE" },
  { rank: 4, name: "—", badge: "MANA" },
];

const TopDonors = () => (
  <Card>
    <CardHeader
      icon={Trophy}
      title="อันดับผู้โดเนท"
      subtitle="Top supporters"
      subtitleClass="font-sans"
    />
    <ul className="divide-y divide-white/5">
      {donors.map((u) => (
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
          <p className="text-sm font-bold text-purple-400">฿0</p>
        </li>
      ))}
    </ul>
  </Card>
);

export default TopDonors;