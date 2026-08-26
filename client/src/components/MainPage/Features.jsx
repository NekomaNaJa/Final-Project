const features = [
  {
    title: "ค่าธรรมเนียม 0%",
    desc: "ทุกการโดเนทที่คุณได้รับ ถึงมือคุณเต็มจำนวน ไม่หักค่าธรรมเนียมแม้แต่บาทเดียว",
  },
  {
    title: "ภารกิจที่คุณสร้างขึ้นได้เอง",
    desc: "ออกแบบภารกิจและเป้าหมายการโดเนทในแบบของคุณ ให้ผู้ชมมีส่วนร่วมมากขึ้น",
  },
  {
    title: "ปรับแต่งโดเนทให้ถูกใจคุณ",
    desc: "ปรับแต่ง Effect เสียง และข้อความแจ้งเตือนการโดเนทได้อย่างอิสระ",
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
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-[#13101c] border border-[#374151] rounded-2xl p-6 text-left
                         hover:border-[#7c3aed]/50 transition-colors"
          >
            <div className="h-24 rounded-xl bg-gradient-to-br from-[#4c1d95]/40 to-[#7c3aed]/20 mb-5" />
            <p className="text-white font-bold text-base mb-2">{f.title}</p>
            <p className="text-[#9ca3af] text-xs leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
