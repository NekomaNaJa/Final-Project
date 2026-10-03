import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

const DashboardNavbar = ({ username, breadcrumb }) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-[#0A0B12]/85 px-8 py-4 backdrop-blur-xl">
      <nav className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gray-500">
        <Link to="/" className="hover:text-purple-400 transition-colors">
          หน้าหลัก
        </Link>
        <span>/</span>
        {breadcrumb ? (
          <>
            <span className="text-white">{breadcrumb}</span>
          </>
        ) : (
          <span className="text-white">ข้อมูลเบื้องต้น</span>
        )}
      </nav>

      <div className="flex items-center gap-3">
        <button className="grid w-9 h-9 place-items-center rounded-full border border-border bg-white/5 text-gray-400 hover:text-purple-400 transition-colors">
          <Bell size={16} />
        </button>
        <div className="flex items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1.5">
          <div className="w-7 h-7 grid place-items-center rounded-full bg-linear-to-br from-purple-500 to-purple-700 text-xs font-bold text-white">
            {username?.[0]?.toUpperCase() || "T"}
          </div>
          <span className="text-sm font-medium text-white">
            {username || "Test"}
          </span>
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
