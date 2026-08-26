import { Link } from "react-router-dom";
import HeroLogo from "../../assets/HeroLogo.png";

const Hero = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 md:px-10 pt-16 pb-20 grid md:grid-cols-2 gap-10 items-center">
      <div>
        <span className="inline-block text-xs font-semibold tracking-wide text-[#a78bfa] border border-[#7c3aed]/50 px-3 py-1 mb-5">
          Next-Gen Streaming Donations
        </span>

        <h1 className="font-serif [font-variant:small-caps] text-white text-4xl md:text-5xl font-bold leading-tight">
          Empower Your
          <br />
          <span className="donix-gradient-text">Legend</span>
        </h1>

        <p className="text-[#9ca3af] text-sm md:text-base mt-5 max-w-md">
          เปลี่ยนทุกการสนับสนุนให้เป็นเซอร์ไพรส์ทรงพลัง ระบบโดเนทออกแบบมาเพื่อ
          Streamer สาย Fantasy โดยเฉพาะ พร้อม Effect สุดตระการตา
        </p>

        <div className="flex items-center gap-4 mt-8">
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white
                       bg-[#7c3aed] hover:bg-[#40128F] transition-colors"
          >
            เริ่มใช้งานฟรี
          </Link>
          <Link
            to="/how-it-works"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white
                       border border-[#374151] hover:border-[#7c3aed]/50 transition-colors"
          >
            ดูวิธีใช้งาน
          </Link>
        </div>
      </div>

      <div className="relative">
        {/* decorative corner lines */}
        <div className="hidden md:block absolute -top-6 -right-6 w-24 h-24 border-t border-r border-[#7c3aed]/60" />
        <div className="hidden md:block absolute -bottom-6 -left-6 w-24 h-24 border-b border-l border-[#7c3aed]/60" />

        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-[#3b0764] via-[#1e1033] to-[#050505] border border-[#374151] flex items-center justify-center p-10">
          <img
            src={HeroLogo}
            alt="Donix - Streamer Donation Platform"
            className="w-full max-w-xs h-auto object-contain"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
