import { useNavigate } from "react-router-dom";
import DashboardSidebar from "../components/Sidebar";
import DashboardTopbar from "../components/Topbar";
import StatCard from "../components/Dashboard/StatCard";
import DonationChart from "../components/Dashboard/DonationChart";
import SupportPanel from "../components/Dashboard/SupportPanel";
import RecentDonations from "../components/Dashboard/RecentDonations";
import PaymentChannels from "../components/Dashboard/PaymentChannels";
import Footer from "../components/MainPage/Footer";
import { Banknote, Heart, Eye } from "lucide-react";

const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = token.split(".")[1];

    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    localStorage.removeItem("token");
    return null;
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const user = getUserFromToken();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#090812] font-sans text-white lg:flex">
      <DashboardSidebar onLogout={handleLogout} />

      <div className="flex-1 min-w-0">
        <DashboardTopbar username={user?.username} />

        <main>
          <div className="mx-auto w-full max-w-[1120px] px-5 py-8 lg:px-8">
            {/* เนื้อหาข้างในเหมือนเดิมทั้งหมด ไม่ต้องแก้ */}
            <div className="mb-7">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#8066d6]">
                Welcome back
              </p>
              <h1 className="text-2xl font-bold text-[#e8e4ee]">
                สวัสดี{" "}
                <span className="font-serif tracking-wide text-[#aa8df1]">
                  {user?.username || "Streamer"}
                </span>{" "}
                !!!
              </h1>
              <p className="mt-1 text-xs text-[#716b7a]">ภาพรวมบัญชีของคุณ</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                title="ยอดการรับเงิน"
                value="0"
                suffix="บาท"
                Icon={Banknote}
                tone="purple"
              />
              <StatCard
                title="จำนวนโดเนท"
                value="0"
                suffix="ครั้ง"
                Icon={Heart}
                tone="green"
              />
              <StatCard
                title="จำนวนผู้ชม"
                value="0"
                suffix="คน"
                Icon={Eye}
                tone="red"
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <DonationChart />
              <SupportPanel />
              <RecentDonations />
              <PaymentChannels />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
