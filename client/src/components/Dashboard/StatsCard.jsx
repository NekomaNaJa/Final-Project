const accentMap = {
  purple: {
    blob: "from-purple-600/30 to-purple-600/0",
    icon: "border-purple-500/40 bg-purple-600/20 text-purple-400",
    badge: "bg-purple-600/20 text-purple-400",
  },
  gold: {
    blob: "from-yellow-500/30 to-yellow-500/0",
    icon: "border-yellow-500/40 bg-yellow-500/20 text-yellow-400",
    badge: "bg-yellow-500/20 text-yellow-400",
  },
  crimson: {
    blob: "from-red-600/30 to-red-600/0",
    icon: "border-red-500/40 bg-red-600/20 text-red-400",
    badge: "bg-red-600/20 text-red-400",
  },
};

const StatsCard = ({
  icon: Icon,
  label,
  value,
  unit,
  percent,
  percentLabel,
  accent = "purple",
}) => {
  const a = accentMap[accent];
  return (
    <section className="relative overflow-hidden rounded-xl border border-white/8 bg-abyss/60 p-5 backdrop-blur-xl hover:border-purple-500/40 transition-all">
      <div
        className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-linear-to-br opacity-60 blur-2xl ${a.blob}`}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 mb-3">
            {label}
          </p>
          <p className="text-3xl font-bold text-white">
            {value.toLocaleString()}{" "}
            <span className="text-sm font-medium text-gray-400">{unit}</span>
          </p>
        </div>
        <div
          className={`w-11 h-11 grid place-items-center rounded-lg border ${a.icon}`}
        >
          <Icon size={20} />
        </div>
      </div>
      <div className="relative mt-4 flex items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-semibold ${a.badge}`}>
          +{percent}%
        </span>
        <span className="text-gray-500">{percentLabel}</span>
      </div>
    </section>
  );
};

export default StatsCard;