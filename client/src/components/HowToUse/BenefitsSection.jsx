import { HandCoins, LayoutPanelTop, Settings2 } from "lucide-react";

const benefits = [
  {
    icon: HandCoins,
    title: "บริการรับโดเนทขึ้นหน้าจอ",
    desc: "รับเงินเข้าบัญชีได้ทันที ไม่เสียค่าธรรมเนียม",
  },
  {
    icon: LayoutPanelTop,
    title: "การออกแบบที่ตอบโจทย์",
    desc: "หน้าตาเว็บออกแบบมาให้ตอบโจทย์สำหรับสตรีมเมอร์แต่ละคนโดยเฉพาะ",
  },
  {
    icon: Settings2,
    title: "ปรับแต่งได้เองตามอิสระ",
    desc: "ปรับแต่งฟอนต์และธีมการโดเนทได้ตามความสะดวกของผู้ใช้อย่างเต็มที่",
  },
];

const BenefitsSection = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 md:px-10 py-16 text-center">
      <h2 className="text-white text-2xl md:text-3xl font-bold mb-12">
        สิ่งที่คุณจะได้รับ
      </h2>

      <div className="grid sm:grid-cols-3 gap-6">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="bg-[#13101c] border border-[#374151] rounded-2xl overflow-hidden
                       hover:border-[#7c3aed]/50 transition-colors"
          >
            <div className="h-40 bg-gradient-to-br from-[#3b0764] via-[#1e1033] to-[#050505] grid place-items-center">
              <b.icon size={40} className="text-[#a78bfa]" />
            </div>
            <div className="p-6">
              <p className="text-white font-bold text-base mb-2">{b.title}</p>
              <p className="text-[#9ca3af] text-xs leading-relaxed">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BenefitsSection;