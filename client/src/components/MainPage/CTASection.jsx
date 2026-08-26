import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 md:px-10 py-16 text-center">
      <h2 className="text-white text-xl md:text-2xl font-bold mb-6">
        สนใจที่จะ <span className="donix-gradient-text">เข้าร่วมกับเรา</span>{" "}
        หรือยัง
      </h2>
      <Link
        to="/register"
        className="inline-block px-8 py-3.5 rounded-xl text-sm font-semibold text-white
                   bg-[#7c3aed] hover:bg-[#6d28d9] transition-colors"
      >
        เริ่มใช้งานฟรี
      </Link>
    </section>
  );
};

export default CTASection;
