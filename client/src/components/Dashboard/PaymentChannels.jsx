const channels = ["TrueMoney Wallet", "PromptPay", "Bank"];

const PaymentChannels = () => (
  <section className="rounded-2xl border border-[#302a49] bg-[#1d1930] p-4">
    <div className="mb-3">
      <p className="text-xs font-bold text-[#d9d5e1]">ช่องทางการรับเงิน</p>
      <p className="text-[8px] uppercase tracking-wide text-[#766f83]">Payment channels</p>
    </div>
    <div className="space-y-2">
      {channels.map((channel) => (
        <div key={channel} className="flex items-center justify-between rounded-lg border border-[#312b47] bg-[#211c35] px-3 py-2">
          <div>
            <p className="text-xs font-semibold text-[#ddd9e6]">{channel}</p>
            <p className="text-[8px] text-[#766f83]">ยังไม่ได้เชื่อมต่อ</p>
          </div>
          <span className="h-4 w-4 rounded border border-[#756e83]" />
        </div>
      ))}
    </div>
  </section>
);

export default PaymentChannels;
