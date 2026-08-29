import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import DonationHistoryTable from "../components/Histor/DonationHistoryTable";

const HistoryPage = () => {
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

  // TODO: replace with real data from GET /api/donations/history
  const history = [];

  return (
    <div className="min-h-screen bg-[#0A0B12] bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.15),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(220,38,38,0.08),transparent_60%)]">
      <div className="flex">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Topbar username={user?.username} breadcrumb="ประวัติการรับเงิน" />
          <main className="flex-1 px-8 py-8">
            {/* Heading */}
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-purple-400/80 mb-2">
                  Donate history
                </p>
                <h1 className="text-4xl font-bold text-white">
                  ประวัติการรับเงินของ{" "}
                  <span className="text-purple-400 text-glow uppercase">
                    {user?.username || "..."}
                  </span>
                </h1>
                <p className="mt-1.5 text-sm text-gray-500">
                  ตรวจสอบและติดตามประวัติโดเนทที่เข้าระบบของคุณได้ที่นี่
                </p>
              </div>
            </div>

            {/* Table */}
            <DonationHistoryTable history={history} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;