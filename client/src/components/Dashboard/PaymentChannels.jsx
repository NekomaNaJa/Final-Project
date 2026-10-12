import React from "react";
import { Gauge } from "lucide-react";
import { Card, CardHeader } from "./CardWrapper";
import { safeGetItem } from "../../utils/sanitizeStorage";

const PaymentChannels = ({ payment }) => {
  const config =
    payment && typeof payment === "object"
      ? payment
      : safeGetItem("donix_payment_config", {});

  const promptpayEnabled = Boolean(config?.promptpay?.enabled);
  const bankEnabled = Boolean(config?.bank?.enabled);

  const channels = [
    {
      name: "PromptPay",
      status: promptpayEnabled ? "เปิดใช้งานแล้ว" : "ยังไม่เชื่อมต่อ",
      ok: promptpayEnabled,
    },
    {
      name: "Bank",
      status: bankEnabled ? "เปิดใช้งานแล้ว" : "ยังไม่เชื่อมต่อ",
      ok: bankEnabled,
    },
  ];

  return (
    <Card>
      <CardHeader
        icon={Gauge}
        title="ช่องทางรับเงิน"
        subtitle="Payment channels"
        subtitleClass="font-sans"
      />
      <ul className="space-y-2 p-5">
        {channels.map((c) => (
          <li
            key={c.name}
            className="flex items-center justify-between rounded-lg border border-white/8 bg-white/5 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-white">{c.name}</p>
              <p
                className={`text-[10px] uppercase tracking-[0.18em] ${
                  c.ok ? "text-purple-400 font-semibold" : "text-gray-600"
                }`}
              >
                {c.status}
              </p>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                c.ok
                  ? "bg-purple-500 shadow-[0_0_12px_rgba(124,58,237,0.8)]"
                  : "bg-gray-700"
              }`}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default PaymentChannels;