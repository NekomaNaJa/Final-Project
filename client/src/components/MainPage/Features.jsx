import React from "react";
import { Coins, Target, Sparkles } from "lucide-react";

const features = [
  {
    title: "ค่าธรรมเนียม 0%",
    desc: "ทุกการโดเนทที่คุณได้รับ ถึงมือคุณเต็มจำนวน ไม่หักค่าธรรมเนียมแม้แต่บาทเดียว",
    emoji: "💸",
    Icon: Coins,
  },
  {
    title: "ภารกิจที่คุณสร้างขึ้นได้เอง",
    desc: "ออกแบบภารกิจและเป้าหมายการโดเนทในแบบของคุณ ให้ผู้ชมมีส่วนร่วมมากขึ้น",
    emoji: "🎯",
    Icon: Target,
  },
  {
    title: "ปรับแต่งโดเนทให้ถูกใจคุณ",
    desc: "ปรับแต่ง Effect เสียง และข้อความแจ้งเตือนการโดเนทได้อย่างอิสระ",
    emoji: "🎨",
    Icon: Sparkles,
  },
];

const Features = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 md:px-10 py-16 text-center">
      <h2 className="text-white text-2xl md:text-3xl font-bold leading-snug">
        รับเงินโดเนท<span className="donix-gradient-text">ของคุณได้ง่ายๆ</span>
        <br />
        และเข้าบัญชี
        <span className="donix-gradient-text">ได้โดยตรง</span> แถม
        <span className="donix-gradient-text">ฟรีค่าธรรมเนียม</span>
      </h2>

      <div className="grid sm:grid-cols-3 gap-6 mt-12">
        {features.map(({ title, desc, emoji, Icon }) => (
          <div
            key={title}
            className="group bg-[#13101c] border border-[#374151] rounded-2xl p-6 text-left
                         hover:border-[#7c3aed]/50 transition-colors"
          >
            <div className="h-24 rounded-xl bg-gradient-to-br from-[#4c1d95]/40 to-[#7c3aed]/20 mb-5 flex items-center justify-center gap-3 relative overflow-hidden">
              <span
                role="img"
                aria-label={title}
                className="text-3xl drop-shadow-[0_0_12px_rgba(167,139,250,0.5)] transition-transform duration-300 group-hover:scale-110"
              >
                {emoji}
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/15 text-purple-300 shadow-[0_0_16px_rgba(139,92,246,0.25)] transition-transform duration-300 group-hover:scale-110">
                <Icon size={22} />
              </div>
            </div>
            <p className="text-white font-bold text-base mb-2">{title}</p>
            <p className="text-[#9ca3af] text-xs leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
