import React from "react";
import { Bell, Target, Trophy, Flag } from "lucide-react";
import { WIDGET_TYPES } from "./widgetStorage";

const ICONS = {
  alert: Bell,
  goal: Target,
  leaderboard: Trophy,
  mission: Flag,
};

const WidgetTypeTabs = ({ activeId, onChange }) => {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {WIDGET_TYPES.map((tab) => {
        const Icon = ICONS[tab.id];
        const active = activeId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-2xl border px-4 py-3.5 text-left transition-all ${
              active
                ? "border-purple-500/50 bg-purple-600/20 shadow-[0_0_20px_rgba(124,58,237,0.25)]"
                : "border-[#2b2542] bg-[#141026]/70 hover:border-purple-500/30 hover:bg-[#18132f]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon size={15} className={active ? "text-purple-300" : "text-gray-400"} />
              <span
                className={`text-xs font-bold uppercase tracking-[0.14em] ${
                  active ? "text-white" : "text-gray-300"
                }`}
              >
                {tab.label}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-[#8c859c]">{tab.description}</p>
          </button>
        );
      })}
    </div>
  );
};

export default WidgetTypeTabs;
