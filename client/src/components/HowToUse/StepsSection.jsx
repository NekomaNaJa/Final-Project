const steps = [
  {
    num: "I",
    title: "เข้าร่วมกับเรา",
    desc: "สมัครและเชื่อมต่อช่องทางรับเงินของคุณเข้ากับระบบ MythicPay ภายในไม่กี่คลิก",
  },
  {
    num: "II",
    title: "ปรับตามสไตล์",
    desc: "ออกแบบหน้ารับโดเนทและเอฟเฟกต์การแจ้งเตือนให้เป็นสไตล์ของคุณเอง",
  },
  {
    num: "III",
    title: "รับเงินโดเนทได้เลย",
    desc: "ผู้ชมโดเนทผ่านทุกช่องทาง เงินเข้าบัญชีให้ทันที พร้อมเอฟเฟกต์ Overlay แบบเรียลไทม์",
  },
];

const StepsSection = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 md:px-10 py-16">
      <div className="text-center mb-12">
        <span className="inline-block text-xs font-semibold tracking-[0.3em] text-[#a78bfa] uppercase mb-3">
          Guidance
        </span>
        <h2 className="text-white text-2xl md:text-3xl font-bold leading-snug">
          วิธีใช้งาน <span className="donix-gradient-text">3 ขั้นตอน</span>
        </h2>
        <p className="text-[#9ca3af] text-xs md:text-sm mt-3 max-w-md mx-auto">
          จากศูนย์สู่การรับโดเนทแบบมืออาชีพในเวลาไม่ถึง 10 นาที
        </p>
      </div>

      <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#374151] bg-[#0d0a17] border border-[#374151] rounded-2xl overflow-hidden">
        {steps.map((step) => (
          <div key={step.num} className="p-8">
            <div className="w-11 h-11 grid place-items-center rounded-full border border-[#7c3aed]/60 text-[#a78bfa] font-bold text-sm mb-5">
              {step.num}
            </div>
            <p className="text-white font-bold text-lg mb-2">{step.title}</p>
            <p className="text-[#9ca3af] text-xs leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StepsSection;