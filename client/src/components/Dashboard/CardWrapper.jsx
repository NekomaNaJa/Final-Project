export const Card = ({ children, className = "" }) => (
  <section
    className={`overflow-hidden rounded-xl border border-white/8 bg-abyss/60 backdrop-blur-xl ${className}`}
  >
    {children}
  </section>
);

export const CardHeader = ({
  icon: Icon,
  title,
  subtitle,
  subtitleClass = "",
  right,
}) => (
  <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 grid place-items-center rounded-lg border border-purple-500/30 bg-purple-600/10 text-purple-400">
        <Icon size={16} />
      </div>
      <div>
        <h3 className="text-base font-bold text-white tracking-wide">
          {title}
        </h3>
        {subtitle && (
          <p
            className={`text-[10px] uppercase tracking-[0.2em] text-gray-500 ${subtitleClass}`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {right}
  </div>
);