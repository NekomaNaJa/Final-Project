import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UserCircle2,
  Wallet,
  Image,
  Sparkles,
  History,
  Settings,
  LogOut,
} from "lucide-react";
import DonixLogo from "../assets/PrimaryLogo.png";

const menuTop = [
  { label: "ข้อมูลเบื้องต้น", icon: LayoutDashboard, to: "/dashboard" },
  { label: "บัญชีผู้ใช้", icon: UserCircle2, to: "/account" },
];

const menuFinance = [
  { label: "บัญชีรับเงิน", icon: Wallet, to: "/payment" },
  { label: "หน้ารับเงิน", icon: Image, to: "/donate-page" },
  { label: "วิดเจ็ตรับเงิน", icon: Sparkles, to: "/widget" },
  { label: "ประวัติการรับเงิน", icon: History, to: "/history" },
];

const SidebarItem = ({ icon: Icon, label, to, end }) => {
  const base =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all";
  const active =
    "border border-purple-500/40 bg-purple-600/15 text-white shadow-[inset_0_0_16px_rgba(124,58,237,0.2)]";
  const inactive = "text-gray-400 hover:bg-white/5 hover:text-white";

  if (to) {
    return (
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
      >
        {({ isActive }) => (
          <>
            <Icon size={16} className={isActive ? "text-purple-400" : ""} />
            <span>{label}</span>
          </>
        )}
      </NavLink>
    );
  }
  return (
    <button className={`${base} ${inactive}`}>
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
};

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  return (
    <aside className="sticky top-0 h-screen w-56 shrink-0 flex flex-col border-r border-border bg-abyss/80 px-4 py-6 backdrop-blur-xl z-30 overflow-y-auto">
      <div className="px-2 mb-8">
        <img src={DonixLogo} alt="DONIX" className="h-7 w-auto" />
      </div>

      <div className="mb-6">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500">
          ทั่วไป
        </p>
        <div className="space-y-1">
          {menuTop.map((m) => (
            <SidebarItem key={m.to} {...m} end={m.to === "/dashboard"} />
          ))}
        </div>
      </div>

      <div>
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500">
          การชำระเงิน
        </p>
        <div className="space-y-1">
          {menuFinance.map((m) => (
            <SidebarItem key={m.to} {...m} />
          ))}
        </div>
      </div>

      <div className="mt-auto space-y-1">
        <SidebarItem icon={Settings} label="ตั้งค่า" to="/settings" />
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut size={16} />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
