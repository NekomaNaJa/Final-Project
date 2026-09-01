import { ChevronLeft, ChevronRight, History } from "lucide-react";

const columns = [
  { key: "time", label: "เวลา" },
  { key: "name", label: "ชื่อ" },
  { key: "message", label: "ข้อความ" },
  { key: "amount", label: "จำนวนเงิน" },
  { key: "channel", label: "ช่องทาง" },
  { key: "status", label: "สถานะ" },
];

const DonationHistoryTable = ({ history = [] }) => {
  const isEmpty = history.length === 0;

  return (
    <section className="overflow-hidden rounded-xl border border-white/8 bg-abyss/60 backdrop-blur-xl">
      {/* Table Header */}
      <div className="grid grid-cols-6 gap-3 border-b border-white/8 bg-white/5 px-6 py-3">
        {columns.map((col) => (
          <p
            key={col.key}
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500"
          >
            {col.label}
          </p>
        ))}
      </div>

      {/* Table Body */}
      {isEmpty ? (
        <div className="grid h-72 place-items-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 grid place-items-center rounded-xl border border-purple-500/30 bg-purple-600/10 text-purple-400">
              <History size={22} />
            </div>
            <p className="text-xs text-gray-500">ยังไม่มีประวัติการรับเงิน</p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {history.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-6 gap-3 px-6 py-3 text-xs text-gray-300 hover:bg-white/5 transition-colors"
            >
              <p className="text-gray-500">{row.time}</p>
              <p className="font-medium">{row.name}</p>
              <p className="truncate text-gray-500">{row.message}</p>
              <p className="font-semibold text-purple-400">{row.amount}</p>
              <p className="text-gray-500">{row.channel}</p>
              <span
                className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-medium ${
                  row.status === "สำเร็จ"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : row.status === "รอดำเนินการ"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    : "bg-red-500/10 text-red-400 border border-red-500/30"
                }`}
              >
                {row.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2 border-t border-white/8 px-6 py-4">
        <button
          type="button"
          disabled
          className="grid h-6 w-6 place-items-center rounded-md border border-white/8 bg-white/5 text-gray-500 disabled:opacity-50"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="grid h-6 w-6 place-items-center rounded-md bg-purple-600 text-[11px] font-semibold text-white">
          1
        </span>
        <button
          type="button"
          disabled
          className="grid h-6 w-6 place-items-center rounded-md border border-white/8 bg-white/5 text-gray-500 disabled:opacity-50"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </section>
  );
};

export default DonationHistoryTable;