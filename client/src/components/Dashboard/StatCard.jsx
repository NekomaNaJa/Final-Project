const StatCard = ({ title, value, suffix, Icon, tone = "purple" }) => {
  const tones = {
    purple: "border-[#6540ad]/40 bg-[#2f2052]/40 text-[#b28aff]",
    green: "border-[#7b8d31]/40 bg-[#2b3120]/50 text-[#c5d36a]",
    red: "border-[#7d2f45]/50 bg-[#3a1e2d]/50 text-[#ff7894]",
  };

  return (
    <div className="rounded-2xl border border-[#2f2947] bg-[#211c37] p-4 shadow-[0_10px_28px_rgba(0,0,0,0.16)]">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-lg border ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-bold text-[#d9d5e1]">{title}</p>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <span className="text-2xl font-semibold text-white">{value}</span>
        <span className="pb-1 text-sm font-semibold text-[#d4cfdd]">{suffix}</span>
      </div>

      <div className="mt-2 h-px bg-[#6c6677]" />
      <div className="mt-1 flex justify-between text-[10px] text-[#7e778b]">
        <span>เดือนนี้</span>
        <span>0 {suffix}</span>
      </div>
    </div>
  );
};

export default StatCard;
