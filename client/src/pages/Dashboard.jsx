import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatsCard from "../components/Dashboard/StatsCard";
import DonationChart from "../components/Dashboard/DonationChart";
import TopDonors from "../components/Dashboard/TopDonors";
import RealtimeFeed from "../components/Dashboard/RealtimeFeed";
import PaymentChannels from "../components/Dashboard/PaymentChannels";
import { Sword, Coins, Gem, Eye } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setTimeout(() => setUser(payload), 0);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0A0B12] bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.15),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(220,38,38,0.08),transparent_60%)]">
      <div className="flex">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Topbar username={user?.username} />
          <main className="flex-1 px-8 py-8">
            {/* Welcome */}
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-purple-400/80 mb-2">
                  Welcome back
                </p>
                <h1 className="text-4xl font-bold text-white">
                  สวัสดี{" "}
                  <span className="text-purple-400 text-glow uppercase">
                    {user?.username || "..."}
                  </span>{" "}
                  !!!
                </h1>
                <p className="mt-1.5 text-sm text-gray-500">
                  ภาพรวมการรับโดเนทของคุณวันนี้
                </p>
              </div>
              <button className="hidden md:inline-flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-600/10 px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-purple-400 hover:bg-purple-600 hover:text-white transition-all">
                <Sword size={14} />
                แชร์ลิงก์โดเนท
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatsCard
                icon={Coins}
                label="ยอดการรับเงิน"
                value={0}
                unit="บาท"
                percent={0}
                percentLabel="เทียบกับสัปดาห์ที่แล้ว"
                accent="purple"
              />
              <StatsCard
                icon={Gem}
                label="จำนวนโดเนท"
                value={0}
                unit="ครั้ง"
                percent={0}
                percentLabel="เทียบกับสัปดาห์ที่แล้ว"
                accent="gold"
              />
              <StatsCard
                icon={Eye}
                label="จำนวนผู้ชม"
                value={0}
                unit="คน"
                percent={0}
                percentLabel="เทียบกับสัปดาห์ที่แล้ว"
                accent="crimson"
              />
            </div>

            {/* Chart + Top Donors */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2">
                <DonationChart />
              </div>
              <TopDonors />
            </div>

            {/* Feed + Payment */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <RealtimeFeed />
              </div>
              <PaymentChannels />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
