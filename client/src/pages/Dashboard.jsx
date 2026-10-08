import React, { useState, useEffect } from "react";
import useJwtUser from "../hooks/useJwtUser";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatsCard from "../components/Dashboard/StatsCard";
import DonationChart from "../components/Dashboard/DonationChart";
import TopDonors from "../components/Dashboard/TopDonors";
import RealtimeFeed from "../components/Dashboard/RealtimeFeed";
import PaymentChannels from "../components/Dashboard/PaymentChannels";
import { Sword, Coins, Gem, Clock } from "lucide-react";
import { fetchDonationStats } from "../utils/api";

const Dashboard = () => {
  const user = useJwtUser();

  const [stats, setStats] = useState({
    totalAmount: 0,
    totalDonations: 0,
    pendingCount: 0,
    topDonors: [],
    chartData: null,
    recentDonations: [],
  });

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      if (!localStorage.getItem("token")) return;
      try {
        const data = await fetchDonationStats();
        if (isMounted && data) {
          setStats({
            totalAmount: data.totalAmount || 0,
            totalDonations: data.totalDonations || 0,
            pendingCount: data.pendingCount || 0,
            topDonors: data.topDonors || [],
            chartData: data.chartData || null,
            recentDonations: data.recentDonations || [],
          });
        }
      } catch {
        // Silently catch errors in background dashboard fetch
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

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
              <button
                type="button"
                className="hidden md:inline-flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-600/10 px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-purple-400 hover:bg-purple-600 hover:text-white transition-all"
              >
                <Sword size={14} />
                แชร์ลิงก์โดเนท
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatsCard
                icon={Coins}
                label="ยอดการรับเงิน"
                value={stats.totalAmount}
                unit="บาท"
                percent={0}
                percentLabel="เทียบกับสัปดาห์ที่แล้ว"
                accent="purple"
              />
              <StatsCard
                icon={Gem}
                label="จำนวนโดเนท"
                value={stats.totalDonations}
                unit="ครั้ง"
                percent={0}
                percentLabel="เทียบกับสัปดาห์ที่แล้ว"
                accent="gold"
              />
              <StatsCard
                icon={Clock}
                label="รายการรอตรวจ"
                value={stats.pendingCount}
                unit="รายการ"
                percent={0}
                percentLabel="สถานะรอดำเนินการ"
                accent="crimson"
              />
            </div>

            {/* Chart + Top Donors */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2">
                <DonationChart data={stats.chartData} />
              </div>
              <TopDonors donors={stats.topDonors} />
            </div>

            {/* Feed + Payment */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <RealtimeFeed feed={stats.recentDonations} />
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
