import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Card, CardHeader } from "./CardWrapper";

const emptyData = {
  "7D": [
    { d: "จ", amount: 0 },
    { d: "อ", amount: 0 },
    { d: "พ", amount: 0 },
    { d: "พฤ", amount: 0 },
    { d: "ศ", amount: 0 },
    { d: "ส", amount: 0 },
    { d: "อา", amount: 0 },
  ],
  "30D": [
    { d: "1", amount: 0 },
    { d: "5", amount: 0 },
    { d: "10", amount: 0 },
    { d: "15", amount: 0 },
    { d: "20", amount: 0 },
    { d: "25", amount: 0 },
    { d: "30", amount: 0 },
  ],
  ALL: [
    { d: "ม.ค.", amount: 0 },
    { d: "ก.พ.", amount: 0 },
    { d: "มี.ค.", amount: 0 },
    { d: "เม.ย.", amount: 0 },
    { d: "พ.ค.", amount: 0 },
    { d: "มิ.ย.", amount: 0 },
  ],
};

const DonationChart = () => {
  const [range, setRange] = useState("7D");

  return (
    <Card>
      <CardHeader
        icon={TrendingUp}
        title="โดเนทล่าสุด"
        subtitle="7 วันที่ผ่านมา"
        subtitleClass="font-sans"
        right={
          <div className="flex gap-1 rounded-lg border border-white/8 bg-white/5 p-0.5 text-[10px] uppercase tracking-[0.18em]">
            {["7D", "30D", "ALL"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded px-2.5 py-1 transition-colors ${
                  range === r
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        }
      />
      <div className="h-64 px-2 pb-4 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={emptyData[range]}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="donixFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
            />
            <XAxis
              dataKey="d"
              stroke="#6B7280"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              stroke="#6B7280"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                background: "#111320",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#7C3AED"
              strokeWidth={2}
              fill="url(#donixFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default DonationChart;