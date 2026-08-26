import { Link } from "react-router-dom";
import DonixLogo from "../assets/PrimaryLogo.png";
import { Bell, ChevronDown } from "lucide-react";

const DashboardTopbar = ({ username }) => (
  <header className="sticky top-0 z-50 h-20 border-b border-[#211c35] bg-[#090812]/95 backdrop-blur">
    <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-5 lg:px-8">
      <Link to="/" className="shrink-0">
        <img src={DonixLogo} alt="Donix" className="h-6 w-auto" />
      </Link>

      <nav className="hidden md:flex items-center gap-8 text-sm text-[#9d97aa]">
        <Link to="/" className="hover:text-white transition-colors">หน้าหลัก</Link>
        <Link to="/discover" className="hover:text-white transition-colors">ค้นพบ</Link>
        <Link to="/how-it-works" className="hover:text-white transition-colors">วิธีใช้งาน</Link>
      </nav>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="การแจ้งเตือน"
          className="grid h-9 w-9 place-items-center rounded-full border border-[#3a344d] text-[#aaa4b5] hover:text-white"
        >
          <Bell className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#442b8a] to-[#7259d8] py-1 pl-1 pr-3 text-sm font-bold text-white shadow-[0_6px_20px_rgba(94,70,205,0.22)]"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full border border-white/40 bg-[#18132b] text-xs">
            {username?.[0]?.toUpperCase() || "U"}
          </span>
          <span className="max-w-24 truncate">{username || "User"}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-80" />
        </button>
      </div>
    </div>
  </header>
);

export default DashboardTopbar;
