import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, BellOff, Check, Heart, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchDonationHistory, getAuthToken } from "../utils/api";
import { getSocket, joinStreamRoom } from "../utils/socket";

const READ_STORAGE_KEY = "donix_read_notifications";

const getSavedReadIds = () => {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveReadIds = (ids) => {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage quota error
  }
};

const formatTimeAgo = (dateInput) => {
  if (!dateInput) return "—";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput);

  const diffMs = Date.now() - d.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "เมื่อสักครู่";
  if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;

  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const NotificationBell = ({ username }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // โหลดรายการโดเนทเริ่มต้นจาก API
  const loadDonations = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      const data = await fetchDonationHistory({ page: 1, limit: 15 });

      let donationsList = [];
      if (Array.isArray(data?.donations)) {
        donationsList = data.donations;
      } else if (Array.isArray(data)) {
        donationsList = data;
      }

      const readIds = new Set(getSavedReadIds());

      const mapped = donationsList.map((item) => {
        const id = String(item._id || item.id || "");
        return {
          id,
          donorName: item.donorName || item.name || "ผู้ไม่ประสงค์ออกนาม",
          amount: typeof item.amount === "number" ? item.amount : Number(item.amount) || 0,
          message: item.message || "",
          createdAt: item.createdAt || new Date().toISOString(),
          paymentMethod: item.paymentMethod || item.channel || "PromptPay",
          isRead: readIds.has(id),
        };
      });

      setNotifications((prev) => {
        const fetchedIds = new Set(mapped.map((m) => m.id));
        const realtimeOnly = prev.filter((p) => !fetchedIds.has(p.id));
        return [...realtimeOnly, ...mapped];
      });
    } catch {
      // ไม่แสดง error ขัดจังหวะการทำงานทั่วไป
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  // เชื่อมต่อ Socket.IO เพื่อรับแจ้งเตือนการโดเนทแบบ Real-time
  useEffect(() => {
    if (!username) return;

    joinStreamRoom(username);
    const socket = getSocket();

    const handleDonationAlert = (alertData) => {
      if (!alertData) return;

      const id = String(alertData.id || alertData._id || `notif_${Date.now()}`);
      const newNotif = {
        id,
        donorName: alertData.donorName || alertData.name || "ผู้ไม่ประสงค์ออกนาม",
        amount:
          typeof alertData.amount === "number"
            ? alertData.amount
            : Number(alertData.amount) || 0,
        message: alertData.message || "",
        createdAt: alertData.createdAt || new Date().toISOString(),
        paymentMethod: alertData.paymentMethod || "PromptPay",
        isRead: false,
      };

      setNotifications((prev) => {
        if (prev.some((n) => n.id === id)) return prev;
        return [newNotif, ...prev];
      });
    };

    socket.on("donation-alert", handleDonationAlert);

    return () => {
      socket.off("donation-alert", handleDonationAlert);
    };
  }, [username]);

  // ปิด Dropdown เมื่อคลิกนอกพื้นที่หรือกดปุ่ม Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    saveReadIds(allIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markSingleAsRead = (id) => {
    const saved = new Set(getSavedReadIds());
    saved.add(id);
    saveReadIds(Array.from(saved));
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const renderNotificationContent = () => {
    if (loading) {
      return (
        <div className="py-8 text-center text-xs text-gray-500">
          กำลังโหลดการแจ้งเตือน...
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-gray-500 mb-3">
            <BellOff size={22} />
          </div>
          <p className="text-xs font-medium text-gray-300">
            ยังไม่มีการแจ้งเตือนการโดเนท
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            เมื่อมีผู้สนับสนุนโดเนทเข้ามา การแจ้งเตือนจะแสดงที่นี่
          </p>
        </div>
      );
    }

    return notifications.map((item) => (
      <button
        type="button"
        key={item.id}
        onClick={() => markSingleAsRead(item.id)}
        className={`w-full text-left flex items-start gap-3 p-3.5 transition-colors focus:outline-none focus:bg-white/10 ${
          item.isRead
            ? "bg-transparent hover:bg-white/5 text-gray-400"
            : "bg-purple-950/20 hover:bg-purple-900/30 text-white"
        }`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500/20 to-purple-600/20 text-pink-400 border border-pink-500/30 mt-0.5">
          <Heart size={14} className="fill-pink-500/40" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold truncate text-white">
              {item.donorName}
            </p>
            <span className="shrink-0 text-xs font-bold text-emerald-400">
              +{item.amount.toLocaleString()} ฿
            </span>
          </div>

          <p className="text-[11px] text-gray-300 mt-0.5">
            โดเนทเข้ามา{" "}
            <span className="font-semibold text-purple-300">
              {item.amount.toLocaleString()} บาท
            </span>
          </p>

          {item.message && (
            <p className="text-[11px] text-gray-400 mt-1 italic line-clamp-2 bg-white/5 rounded-md px-2 py-1">
              "{item.message}"
            </p>
          )}

          <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
            <span>{formatTimeAgo(item.createdAt)}</span>
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-gray-400">
              {item.paymentMethod}
            </span>
          </div>
        </div>

        {!item.isRead && (
          <span className="h-2 w-2 rounded-full bg-purple-400 shrink-0 mt-1.5 ring-2 ring-purple-400/20" />
        )}
      </button>
    ));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ปุ่มกระดิ่งแจ้งเตือน */}
      <button
        type="button"
        aria-label="แจ้งเตือนการโดเนท"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative grid w-9 h-9 place-items-center rounded-full border border-border bg-white/5 text-gray-400 hover:text-purple-400 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-[#0A0B12] animate-pulse"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* เมนูแจ้งเตือน (Dropdown Popover) */}
      {isOpen && (
        <div
          data-testid="notification-dropdown"
          className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-white/10 bg-[#120f22] p-0 shadow-2xl shadow-purple-950/40 backdrop-blur-xl overflow-hidden animate-in fade-in duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400">
                <Bell size={14} />
              </div>
              <h3 className="text-sm font-semibold text-white">การแจ้งเตือน</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[11px] font-medium text-purple-300">
                  {unreadCount} ใหม่
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Check size={13} />
                <span>อ่านทั้งหมด</span>
              </button>
            )}
          </div>

          {/* Body: รายการโดเนท */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {renderNotificationContent()}
          </div>

          {/* Footer: ลิงก์ไปหน้าประวัติ */}
          <div className="border-t border-white/10 p-2.5 bg-[#0e0c1b] text-center">
            <Link
              to="/history"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors py-1 w-full"
            >
              <span>ดูประวัติการรับเงินทั้งหมด</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
