import React, { useState, useEffect, useCallback } from "react";
import useJwtUser from "../hooks/useJwtUser";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import DonationHistoryTable from "../components/Histor/DonationHistoryTable";
import SlipModal from "../components/Histor/SlipModal";
import { fetchDonationHistory, updateDonationStatus } from "../utils/api";
import { Search, Filter, CheckCircle2, AlertCircle } from "lucide-react";

const filterTabs = [
  { key: "all", label: "ทั้งหมด" },
  { key: "pending", label: "รอตรวจสอบ" },
  { key: "approved", label: "อนุมัติแล้ว" },
  { key: "rejected", label: "ปฏิเสธ" },
];

const HistoryPage = () => {
  const user = useJwtUser();

  const [donations, setDonations] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadDonations = useCallback(async () => {
    try {
      const res = await fetchDonationHistory({
        page,
        limit: 10,
        status: statusFilter,
        search: searchQuery,
      });
      if (res?.donations) {
        setDonations(res.donations);
        setTotalPages(res.pagination?.totalPages || 1);
      } else if (Array.isArray(res)) {
        setDonations(res);
      } else {
        setDonations([]);
      }
    } catch (err) {
      // Don't show toast if user is unauthenticated or unmounted
      if (localStorage.getItem("token")) {
        setFeedback({
          type: "error",
          message: err.message || "ไม่สามารถดึงข้อมูลประวัติการรับเงินได้",
        });
      }
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    void loadDonations();
  }, [loadDonations]);

  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadDonations();
  };

  const handleUpdateStatus = async (donationId, newStatus) => {
    try {
      setActionLoading(true);
      await updateDonationStatus(donationId, newStatus);
      setFeedback({
        type: "success",
        message:
          newStatus === "approved"
            ? "อนุมัติรายการบริจาคสำเร็จ"
            : "ปฏิเสธรายการบริจาคสำเร็จ",
      });
      setSelectedSlip(null);
      await loadDonations();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "ไม่สามารถอัปเดตสถานะได้",
      });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B12] bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.15),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(220,38,38,0.08),transparent_60%)]">
      <div className="flex">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Topbar username={user?.username} breadcrumb="ประวัติการรับเงิน" />
          <main className="flex-1 px-8 py-8">
            {/* Heading */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
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
                  ตรวจสอบและติดตามประวัติโดเนทที่เข้าระบบของคุณได้ที่นี่ (คลิกที่แถวเพื่อดูสลิปและจัดการสถานะ)
                </p>
              </div>

              {/* Search Form */}
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ หรือข้อความ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 pl-9 text-xs text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-all"
                />
                <Search
                  size={14}
                  className="absolute left-3 text-gray-500 pointer-events-none"
                />
              </form>
            </div>

            {/* Notification alert */}
            {feedback && (
              <div
                role="alert"
                className={`mb-5 flex items-center gap-2 rounded-xl p-3.5 text-xs font-medium border transition-all ${
                  feedback.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs mr-2">
                <Filter size={14} />
                <span>ตัวกรอง:</span>
              </div>
              <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleStatusChange(tab.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      statusFilter === tab.key
                        ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.35)]"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <DonationHistoryTable
              history={donations}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onRowClick={(item) => setSelectedSlip(item)}
            />

            {/* Modal */}
            <SlipModal
              isOpen={Boolean(selectedSlip)}
              donation={selectedSlip}
              onClose={() => setSelectedSlip(null)}
              onApprove={(id) => handleUpdateStatus(id, "approved")}
              onReject={(id) => handleUpdateStatus(id, "rejected")}
              actionLoading={actionLoading}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;