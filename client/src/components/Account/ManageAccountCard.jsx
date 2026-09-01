import React from "react";
import { Pencil } from "lucide-react";

const DiscordIcon = (
  <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127c-.598.35-1.22.647-1.873.892a.076.076 0 0 0-.04.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.001-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.548-13.66a.06.06 0 0 0-.031-.028zM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.332-.955 2.418-2.157 2.418zm7.974 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.332-.946 2.418-2.157 2.418z" />
  </svg>
);

const StreamlabsIcon = (
  <svg className="w-4 h-4 text-[#80F5D2]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2 3 7v10l9 5 9-5V7l-9-5zm0 2.31 6.93 3.85L12 12.02 5.07 8.16 12 4.31zM5 9.7l6 3.34v6.66L5 16.3V9.7zm8 10v-6.66l6-3.34v6.6l-6 3.4z" />
  </svg>
);

const rows = [
  {
    key: "email",
    label: "อีเมล",
    icon: null,
    value: "user@example.com",
    connected: true,
  },
  {
    key: "phone",
    label: "เบอร์โทรศัพท์",
    icon: null,
    value: "000-000-0000",
    connected: true,
  },
  {
    key: "discord",
    label: "DISCORD",
    icon: DiscordIcon,
    value: "ยังไม่ได้เชื่อมต่อ",
    connected: false,
  },
  {
    key: "streamlabs",
    label: "STREAMLABS",
    icon: StreamlabsIcon,
    value: "ยังไม่ได้เชื่อมต่อ",
    connected: false,
  },
];

const ManageAccountCard = () => {
  return (
    <section className="rounded-2xl border border-[#2b2542] bg-[#16122a]/80 backdrop-blur-md p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            จัดการบัญชี
          </h2>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#80779b]">
            MANAGE ACCOUNT
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full bg-[#8b5cf6] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#7c3aed] shadow-[0_0_16px_rgba(139,92,246,0.35)] transition-colors"
        >
          <Pencil size={12} />
          <span>แก้ไข</span>
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-3 rounded-xl border border-[#2e2648]/60 bg-[#110d22]/50 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9891ab]">
                {row.icon}
                {row.label}
              </p>
              <p
                className={`mt-0.5 truncate text-sm font-medium ${
                  row.connected ? "text-white" : "text-[#5c556f]"
                }`}
              >
                {row.value}
              </p>
            </div>

            {row.connected ? (
              <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400">
                ยืนยันแล้ว
              </span>
            ) : (
              <button
                type="button"
                className="shrink-0 text-[11px] font-medium text-purple-300 hover:text-purple-200 transition-colors"
              >
                คลิกเพื่อเชื่อมต่อ
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ManageAccountCard;