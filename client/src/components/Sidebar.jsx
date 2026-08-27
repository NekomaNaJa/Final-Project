import { NavLink } from "react-router-dom";
import {
  Home,
  User,
  Wallet,
  Flag,
  Clock,
  Settings,
  LogOut,
} from "lucide-react";

const menuGroups = [
  {
    label: "ทั่วไป",
    items: [
      {
        label: "ข้อมูลเบื้องต้น",
        to: "/dashboard",
        icon: Home,
        end: true,
      },
      {
        label: "บัญชีผู้ใช้",
        to: "/dashboard/account",
        icon: User,
      },
    ],
  },
  {
    label: "การเงิน",
    items: [
      {
        label: "บัญชีรับเงิน",
        to: "/dashboard/payment",
        icon: Wallet,
      },
      {
        label: "พันธกิจโดเนท",
        to: "/dashboard/missions",
        icon: Flag,
      },
      {
        label: "วิธีรับโดเนท",
        to: "/dashboard/how-to-receive",
        icon: User,
      },
      {
        label: "ประวัติการรับเงิน",
        to: "/dashboard/history",
        icon: Clock,
      },
    ],
  },
];

const DashboardSidebar = ({ onLogout }) => {
  const menuClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-[#4f248c] to-[#312064] text-white shadow-[0_0_18px_rgba(113,72,202,0.18)]"
        : "text-[#b1abbf] hover:bg-white/[0.04] hover:text-white"
    }`;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-[#2b2543] bg-[#151127] pt-20 lg:flex">
      <div className="flex-1 px-4 py-5">
        {menuGroups.map((group) => (
          <div key={group.label} className="mb-7">
            <p className="mb-2 px-2 text-[10px] font-medium text-[#6f6883]">
              {group.label}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    end={item.end}
                    className={menuClass}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1 border-t border-[#2b2543] p-4">
        <NavLink
          to="/dashboard/settings"
          className={menuClass}
        >
          <Settings className="h-4 w-4" />
          <span>ตั้งค่า</span>
        </NavLink>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-[#b1abbf] transition-all duration-200 hover:bg-white/[0.04] hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;