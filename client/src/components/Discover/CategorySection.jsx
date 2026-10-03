import { Link } from "react-router-dom";
import StreamerCard from "./StreamerCard";

const CategorySection = ({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  streamers,
  live = false,
}) => {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span
            className={`grid h-7 w-7 place-items-center rounded-full ${iconColor}`}
          >
            <Icon size={14} className="text-white" />
          </span>
          <h2 className="text-white text-lg font-bold">{title}</h2>
        </div>

        <Link
          to="/discover"
          className="text-[#a78bfa] text-xs hover:text-[#c4b5fd] transition-colors"
        >
          ดูทั้งหมด
        </Link>
      </div>

      <p className="text-[#9ca3af] text-xs mb-4 ml-9">{subtitle}</p>

      <div className="grid sm:grid-cols-3 gap-6">
        {streamers.map((s, i) => (
          <StreamerCard key={i} {...s} live={live} />
        ))}
      </div>
    </section>
  );
};

export default CategorySection;